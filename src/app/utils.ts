import { Vector2 } from './vector';

export const DegreesToRadians = (degrees: number) => {
	return degrees * Math.PI / 180;
}

export const RadiansToDegrees = (radians: number) => {
	return radians * 180 / Math.PI;
}

export const GetInputCouplerAndOutputAngleInRadians = (fixedLinkLength: number, inputLinkLength: number, couplerLinkLength: number, outputLinkLength: number, inputJointAngleInRadians: number) => {
	const diagonalLength = SideLengthFromSideAngleInRadiansSide(fixedLinkLength, inputJointAngleInRadians, inputLinkLength);
	return {
		inputCouplerAngle: AngleInRadiansFrom3Sides(diagonalLength, inputLinkLength, fixedLinkLength) + AngleInRadiansFrom3Sides(diagonalLength, couplerLinkLength, outputLinkLength),
		outputAngle: AngleInRadiansFrom3Sides(diagonalLength, outputLinkLength, couplerLinkLength) + AngleInRadiansFrom3Sides(diagonalLength, fixedLinkLength, inputLinkLength)
	};
}

export const AngleInRadiansFrom3Sides = (adjacentSideLength1: number, adjacentSideLength2: number, oppositeSideLength: number) => Math.acos(
	(Math.pow(adjacentSideLength1, 2) + Math.pow(adjacentSideLength2, 2) - Math.pow(oppositeSideLength, 2)) /
	(2 * adjacentSideLength1 * adjacentSideLength2)
);

export const SideLengthFromSideAngleInRadiansSide = (adjacentSideLength1: number, oppositeCornerAngleInRadians: number, adjacentSideLength2: number) => Math.sqrt(
	Math.pow(adjacentSideLength1, 2) +
	Math.pow(adjacentSideLength2, 2) -
	2 * adjacentSideLength1 * adjacentSideLength2 * Math.cos(oppositeCornerAngleInRadians)
);

export const RotatePointAroundPointByAngleInRadians = (pointToRotate: Vector2, centrepoint: Vector2, angleInRadians: number) => {
	const cosTheta = Math.cos(angleInRadians);
	const sinTheta = Math.sin(angleInRadians);

	const { x, y } = pointToRotate.subtract(centrepoint);

	return new Vector2(
		x * cosTheta - y * sinTheta,
		y * cosTheta + x * sinTheta
	).add(centrepoint);
};