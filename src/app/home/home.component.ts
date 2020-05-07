import { Component, OnDestroy } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

import { combineLatest, defer, merge, Observable } from 'rxjs';
import { map, shareReplay, startWith, tap, distinctUntilChanged } from 'rxjs/operators';

import { Vector2, Vector3 } from '../vector';

import { AngleInRadiansFrom3Sides, DegreesToRadians, GetInputCouplerAndOutputAngleInRadians, RadiansToDegrees, RotatePointAroundPointByAngleInRadians } from '../utils';

interface IJointPointElements {
  inputJointX: string;
  inputJointY: string;
  inputJointZ: string;

  inputCouplerJointX: string;
  inputCouplerJointY: string;
  inputCouplerJointZ: string;

  couplerOutputJointX: string;
  couplerOutputJointY: string;
  couplerOutputJointZ: string;

  outputJointX: string;
  outputJointY: string;
  outputJointZ: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnDestroy {

  inputDataModel = [
    {
      joint: `Input`,
      data: [
        { formControlName: `inputJointX`, placeholder: `1787` },
        { formControlName: `inputJointY`, placeholder: `0` },
        { formControlName: `inputJointZ`, placeholder: `1916` }
      ]
    },
    {
      joint: `Input-Coupler`,
      data: [
        { formControlName: `inputCouplerJointX`, placeholder: `1910` },
        { formControlName: `inputCouplerJointY`, placeholder: `0` },
        { formControlName: `inputCouplerJointZ`, placeholder: `2006` }
      ]
    },
    {
      joint: `Coupler-Output`,
      data: [
        { formControlName: `couplerOutputJointX`, placeholder: `1830` },
        { formControlName: `couplerOutputJointY`, placeholder: `0` },
        { formControlName: `couplerOutputJointZ`, placeholder: `2006` }
      ]
    },
    {
      joint: `Output`,
      data: [
        { formControlName: `outputJointX`, placeholder: `1690` },
        { formControlName: `outputJointY`, placeholder: `0` },
        { formControlName: `outputJointZ`, placeholder: `1953` }
      ]
    }
  ];

  jointFormFroup = new FormGroup(this.inputDataModel
    .reduce((accumulator, joint) => Object.assign(accumulator, ...joint.data
      .map(jointDataEntry => ({ [jointDataEntry.formControlName]: new FormControl() }))), {}));

  bonnetOpeningFormControl = new FormControl(0);
  inputOffsetFormControl = new FormControl(0);

  private bonnetOpening = defer(() => this.bonnetOpeningFormControl.valueChanges.pipe(
    startWith(this.bonnetOpeningFormControl.value),
    distinctUntilChanged(),
    map(value => Number(value)),
    shareReplay(1)
  ));

  private inputOffset = defer(() => this.inputOffsetFormControl.valueChanges.pipe(
    startWith(this.inputOffsetFormControl.value),
    distinctUntilChanged(),
    map(value => Number(value)),
    shareReplay(1)
  ));

  private jointFormFroupValueChanges: Observable<IJointPointElements> = defer(() => this.jointFormFroup.valueChanges.pipe(startWith(this.jointFormFroup.value)));

  private inputJointPoint = this.jointFormFroupValueChanges.pipe(
    distinctUntilChanged((prev, curr) => prev.inputJointX === curr.inputJointX && prev.inputJointY === curr.inputJointY && prev.inputJointZ === curr.inputJointZ),
    map(value => new Vector3(value.inputJointX, value.inputJointY, value.inputJointZ)),
    shareReplay(1)
  );

  private inputCouplerJointPoint = this.jointFormFroupValueChanges.pipe(
    distinctUntilChanged((prev, curr) => prev.inputCouplerJointX === curr.inputCouplerJointX && prev.inputCouplerJointY === curr.inputCouplerJointY && prev.inputCouplerJointZ === curr.inputCouplerJointZ),
    map(value => new Vector3(value.inputCouplerJointX, value.inputCouplerJointY, value.inputCouplerJointZ)),
    shareReplay(1)
  );

  private couplerOutputJointPoint = this.jointFormFroupValueChanges.pipe(
    distinctUntilChanged((prev, curr) => prev.couplerOutputJointX === curr.couplerOutputJointX && prev.couplerOutputJointY === curr.couplerOutputJointY && prev.couplerOutputJointZ === curr.couplerOutputJointZ),
    map(value => new Vector3(value.couplerOutputJointX, value.couplerOutputJointY, value.couplerOutputJointZ)),
    shareReplay(1)
  );

  private outputJointPoint = this.jointFormFroupValueChanges.pipe(
    distinctUntilChanged((prev, curr) => prev.outputJointX === curr.outputJointX && prev.outputJointY === curr.outputJointY && prev.outputJointZ === curr.outputJointZ),
    map(value => new Vector3(value.outputJointX, value.outputJointY, value.outputJointZ)),
    shareReplay(1)
  );

  private lookUpTable = combineLatest([this.inputJointPoint, this.inputCouplerJointPoint, this.couplerOutputJointPoint, this.outputJointPoint])
    .pipe(
      map(([inputJointPoint, inputCouplerJointPoint, couplerOutputJointPoint, outputJointPoint]) => {

        if ([].concat(...[inputJointPoint, inputCouplerJointPoint, couplerOutputJointPoint, outputJointPoint]
          .map(point => [point.x, point.y, point.z]))
          .filter(value => value === null || value === undefined).length > 0) {
          return [{
            inputOffset: 0,
            bonnetAngle: 0,
            points2d: {
              inputJointPoint: new Vector2(),
              inputCouplerJointPoint: new Vector2(),
              couplerOutputJointPoint: new Vector2(),
              outputJointPoint: new Vector2()
            }
          }];
        }

        let direction = -1;

        if (inputJointPoint.x < outputJointPoint.x) {
          inputCouplerJointPoint = new Vector3(inputCouplerJointPoint.x - 2 * (inputCouplerJointPoint.x - inputJointPoint.x), inputCouplerJointPoint.y, inputCouplerJointPoint.z);
          couplerOutputJointPoint = new Vector3(couplerOutputJointPoint.x - 2 * (couplerOutputJointPoint.x - inputJointPoint.x), couplerOutputJointPoint.y, couplerOutputJointPoint.z);
          outputJointPoint = new Vector3(outputJointPoint.x - 2 * (outputJointPoint.x - inputJointPoint.x), outputJointPoint.y, outputJointPoint.z);

          direction = 1;
        }

        const fixedLinkLength = outputJointPoint.subtract(inputJointPoint).length();
        const inputLinkLength = inputJointPoint.subtract(inputCouplerJointPoint).length();
        const couplerLinkLength = inputCouplerJointPoint.subtract(couplerOutputJointPoint).length();
        const outputLinkLength = couplerOutputJointPoint.subtract(outputJointPoint).length();

        const outputInputCouplerDiagonalLength = outputJointPoint.subtract(inputCouplerJointPoint).length();
        const couplerOutputInputDiagonalLength = inputJointPoint.subtract(couplerOutputJointPoint).length();

        const inputJointAngleInRadians = AngleInRadiansFrom3Sides(fixedLinkLength, inputLinkLength, outputInputCouplerDiagonalLength);
        const inputCouplerJointAngleInRadians = AngleInRadiansFrom3Sides(couplerLinkLength, inputLinkLength, couplerOutputInputDiagonalLength);
        const outputJointAngleInRadians = AngleInRadiansFrom3Sides(outputLinkLength, fixedLinkLength, couplerOutputInputDiagonalLength);

        const inputJointPoint2d = new Vector2(inputJointPoint.x, -1 * inputJointPoint.z);
        const inputCouplerJointPoint2d = new Vector2(inputCouplerJointPoint.x, -1 * inputCouplerJointPoint.z);
        const couplerOutputJointPoint2d = new Vector2(couplerOutputJointPoint.x, -1 * couplerOutputJointPoint.z);
        const outputJointPoint2d = new Vector2(outputJointPoint.x, -1 * outputJointPoint.z);

        const byInputOffset = [{
          inputOffset: 0,
          bonnetAngle: 0,
          points2d: {
            inputJointPoint: inputJointPoint2d,
            inputCouplerJointPoint: inputCouplerJointPoint2d,
            couplerOutputJointPoint: couplerOutputJointPoint2d,
            outputJointPoint: outputJointPoint2d
          }
        }];

        let previousAngle = 0;

        for (let inputJointOffset = 1; inputJointOffset < 36000; ++inputJointOffset) {
          const inputJointOffsetInDegrees = inputJointOffset / (direction * 100);
          const inputJointOffsetInRadians = DegreesToRadians(inputJointOffsetInDegrees);

          const { inputCouplerAngle: newInputCouplerAngleInRadians, outputAngle: newOutputAngleInRadians } = GetInputCouplerAndOutputAngleInRadians(fixedLinkLength, inputLinkLength, couplerLinkLength, outputLinkLength, inputJointAngleInRadians + inputJointOffsetInRadians);

          if (isNaN(newInputCouplerAngleInRadians)) break;

          const inputCouplerOffsetInRadians = newInputCouplerAngleInRadians - inputCouplerJointAngleInRadians;

          const bonnetAngleInRadians = (direction > 0 ? -1 : 1) * (inputCouplerOffsetInRadians + inputJointOffsetInRadians);
          const bonnetAngleInDegrees = RadiansToDegrees(bonnetAngleInRadians);

          if (bonnetAngleInDegrees < previousAngle) break;
          else previousAngle = bonnetAngleInDegrees;

          const outputJointOffsetInRadians = outputJointAngleInRadians - newOutputAngleInRadians;

          byInputOffset.push({
            inputOffset: inputJointOffsetInDegrees,
            bonnetAngle: Math.round(10000 * bonnetAngleInDegrees) / 10000,
            points2d: {
              inputJointPoint: inputJointPoint2d,
              inputCouplerJointPoint: RotatePointAroundPointByAngleInRadians(inputCouplerJointPoint2d, inputJointPoint2d, inputJointOffsetInRadians),
              couplerOutputJointPoint: RotatePointAroundPointByAngleInRadians(couplerOutputJointPoint2d, outputJointPoint2d, outputJointOffsetInRadians),
              outputJointPoint: outputJointPoint2d
            }
          });
        }

        return byInputOffset;
      }),
      shareReplay(1)
    );

  minMax = this.lookUpTable.pipe(map(lookUpTable => {
    const lookUpTableMaxIndex = lookUpTable.length - 1;
    const lastTableEntry = lookUpTable[lookUpTableMaxIndex];

    return {
      minBonnetAngle: 0,
      maxBonnetAngle: lastTableEntry.bonnetAngle,
      minOffset: Math.min(0, lastTableEntry.inputOffset),
      maxOffset: Math.max(0, lastTableEntry.inputOffset)
    };
  }), shareReplay(1));

  private updateInputOffsetFormControl = true;
  private updateBonnetOpeningFormControl = true;

  private closestBonnetOpening = combineLatest([this.bonnetOpening, this.lookUpTable]).pipe(
    map(([bonnetOpening, lookUpTable]) => lookUpTable.reduce((previous, current) =>
      Math.abs(current.bonnetAngle - bonnetOpening) < Math.abs(previous.bonnetAngle - bonnetOpening) ? current : previous)),
    tap(closest => {
      if (this.updateBonnetOpeningFormControl) {
        this.updateInputOffsetFormControl = false;
        this.inputOffsetFormControl.setValue(closest.inputOffset);
      }
      else
        this.updateBonnetOpeningFormControl = true;
    }), shareReplay(1));

  private closestInputOffset = combineLatest([this.inputOffset, this.lookUpTable]).pipe(
    map(([inputOffset, lookUpTable]) => lookUpTable.reduce((previous, current) =>
      Math.abs(current.inputOffset - inputOffset) < Math.abs(previous.inputOffset - inputOffset) ? current : previous)),
    tap(closest => {
      if (this.updateInputOffsetFormControl) {
        this.updateBonnetOpeningFormControl = false;
        this.bonnetOpeningFormControl.setValue(closest.bonnetAngle);
      }
      else
        this.updateInputOffsetFormControl = true;
    }), shareReplay(1));

  pathData = merge(this.closestBonnetOpening, this.closestInputOffset).pipe(
    map(closest => {
      const points = closest.points2d;
      const xs = Object.values(points).map(vector => vector.x);

      if (Math.min(...xs) === Math.max(...xs)) return ``;

      return `
        M ${points.inputJointPoint.x} ${points.inputJointPoint.y}
        L ${points.inputCouplerJointPoint.x} ${points.inputCouplerJointPoint.y}
        L ${points.couplerOutputJointPoint.x} ${points.couplerOutputJointPoint.y}
        L ${points.outputJointPoint.x} ${points.outputJointPoint.y}
        L ${points.inputJointPoint.x} ${points.inputJointPoint.y}
      `;
    }), shareReplay(1));

  viewBox = this.lookUpTable.pipe(map(lookupEntries => {
    let minX: number = null;
    let maxX: number = null;
    let minY: number = null;
    let maxY: number = null;

    for (let lookupEntryValue of lookupEntries.values()) {
      for (let point of Object.values(lookupEntryValue.points2d)) {
        if (point.x < minX || minX === null) minX = point.x;
        if (point.y < minY || minY === null) minY = point.y;
        if (point.x > maxX || maxX === null) maxX = point.x;
        if (point.y > maxY || maxY === null) maxY = point.y;
      }
    }

    const width = maxX - minX;
    const height = maxY - minY;

    const padding = 10;

    return `${minX - padding} ${minY - padding} ${width + 2 * padding} ${height + 2 * padding}`;
  }));

  private paramMapSubscription = this.activatedRoute.paramMap.subscribe(params => {
    const newJointValues: IJointPointElements = {
      inputJointX: params.has(`ix`) ? params.get(`ix`) : null,
      inputJointY: params.has(`iy`) ? params.get(`iy`) : null,
      inputJointZ: params.has(`iz`) ? params.get(`iz`) : null,

      inputCouplerJointX: params.has(`icx`) ? params.get(`icx`) : null,
      inputCouplerJointY: params.has(`icy`) ? params.get(`icy`) : null,
      inputCouplerJointZ: params.has(`icz`) ? params.get(`icz`) : null,

      couplerOutputJointX: params.has(`cox`) ? params.get(`cox`) : null,
      couplerOutputJointY: params.has(`coy`) ? params.get(`coy`) : null,
      couplerOutputJointZ: params.has(`coz`) ? params.get(`coz`) : null,

      outputJointX: params.has(`ox`) ? params.get(`ox`) : null,
      outputJointY: params.has(`oy`) ? params.get(`oy`) : null,
      outputJointZ: params.has(`oz`) ? params.get(`oz`) : null
    };

    for (let [newJointValueKey, newJointValueValue] of Object.entries(newJointValues)) {
      if (isNaN(Number(newJointValueValue))) newJointValues[newJointValueKey] = null;
    }

    const currentJointValues = this.jointFormFroup.value;

    for (let [newJointValueKey, newJointValueValue] of Object.entries(newJointValues)) {
      if (currentJointValues[newJointValueKey] !== newJointValueValue) {
        this.jointFormFroup.patchValue(newJointValues);
        break;
      }
    }
  });

  private urlParamsSubscription = this.jointFormFroupValueChanges.subscribe(values => {
    const newParams = [
      [`ix`, values.inputJointX], [`iy`, values.inputJointY], [`iz`, values.inputJointZ],
      [`icx`, values.inputCouplerJointX], [`icy`, values.inputCouplerJointY], [`icz`, values.inputCouplerJointZ],
      [`cox`, values.couplerOutputJointX], [`coy`, values.couplerOutputJointY], [`coz`, values.couplerOutputJointZ],
      [`ox`, values.outputJointX], [`oy`, values.outputJointY], [`oz`, values.outputJointZ]
    ]
      .filter(([, value]) => value !== null)
      .reduce((accumulator, [key, value]) => {
        accumulator[key] = value;
        return accumulator;
      }, {});

    const currentParams = this.activatedRoute.snapshot.paramMap;

    if (currentParams.keys.length !== Object.keys(newParams).length)
      this.router.navigate([`app`, newParams]);

    else
      for (let [newParamKey, newParamValue] of Object.entries(newParams)) {
        if (currentParams.get(newParamKey) !== newParamValue) {
          this.router.navigate([`app`, newParams]);
          break;
        }
      }
  });

  constructor(private router: Router, private activatedRoute: ActivatedRoute) { }

  ngOnDestroy() {
    this.urlParamsSubscription.unsubscribe();
    this.paramMapSubscription.unsubscribe();
  }
}
