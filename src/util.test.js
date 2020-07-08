import {
  calculatePostBoilVolume,
  calculateNewGravity,
  _calculateBignessFactor,
  _calculateBoilTimeFactor,
  calculateHopUtilisationFactor,
  calculateIBU,
} from "./util.js";

test("calculates calculatePostBoilVolume", () => {
  const startVolumeLiters = 30;
  const boilOffRatePerHour = 10;
  const minutes = 60;
  const expected = 20;
  const actual = calculatePostBoilVolume(
    startVolumeLiters,
    boilOffRatePerHour,
    minutes
  );
  expect(actual).toEqual(expected);
});

test("calculates new gravity", () => {
  const startVolume = 30;
  const startGravity = 1.05;
  const endVolume = 20;
  const expected = 1.075;
  const actual = calculateNewGravity(startVolume, startGravity, endVolume);
  expect(actual).toEqual(expected);
});

test("calculates Bigness Factor", () => {
  const gravity = 1.05;
  const expected = 1.0527601683713252;
  const actual = _calculateBignessFactor(gravity);
  expect(actual).toBeCloseTo(expected);
});

test("calculates Boil Time Factor", () => {
  const boilTime = 60;
  const expected = 0.21910410764110538;
  const actual = _calculateBoilTimeFactor(boilTime);
  expect(actual).toBeCloseTo(expected);
});

const calculateHopUtilisationFactorCases = [
  [1.03, 0, 0],
  [1.08, 12, 0.074],
  [1.06, 33, 0.17],
  [1.05, 120, 0.252],
];

test.each(calculateHopUtilisationFactorCases)(
  "calculates calculateHopUtilisationFactor for gravity %s, boilTime %s = %s",
  (gravity, boilTime, expected) => {
    const actual = calculateHopUtilisationFactor(gravity, boilTime);
    expect(actual).toBeCloseTo(expected);
  }
);

test("calculateIBU", () => {
  const weightGrams = 100;

  /*
   based on lookup chart: https://realbeer.com/hops/research.html
   1.060, 60 minutes
  */

  const alphaAcids = 4.5;
  const boilEndVolumeLiters = 44;

  /* Brewtarget uses fixed end-of-boil gravity:
    https://github.com/Brewtarget/brewtarget/issues/438
  */
  var gravity = 1.06;
  var utilisationFactor = calculateHopUtilisationFactor(gravity, 60);
  // BrewTarget gives 21.6
  var expected = 21.56;

  var actual = calculateIBU(
    weightGrams,
    utilisationFactor,
    alphaAcids,
    boilEndVolumeLiters
  );
  expect(actual).toBeCloseTo(expected);
  /*
    Tinseth uses moment-by-moment gravity

    With 60 minutes to go, we are still at the start-of-boil gravity
  */

  var gravity = 1.048;
  var utilisationFactor = calculateHopUtilisationFactor(gravity, 60);
  // Tinseth gives 24
  var expected = 24.01850554476756;

  var actual = calculateIBU(
    weightGrams,
    utilisationFactor,
    alphaAcids,
    boilEndVolumeLiters
  );
  expect(actual).toBeCloseTo(expected);
});
