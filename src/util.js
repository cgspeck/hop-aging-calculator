/*
  Hop Age Adjuster
  Copyright (C) 2020 Chris Speck

  This program is free software: you can redistribute it and/or modify
  it under the terms of the GNU Affero General Public License as published
  by the Free Software Foundation, either version 3 of the License, or
  (at your option) any later version.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU Affero General Public License for more details.

  You should have received a copy of the GNU Affero General Public License
  along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

function createId() {
  return new Date().getTime();
}

function calculatePostBoilVolume(
  startVolumeLiters,
  boilOffRatePerHour,
  minutes
) {
  return startVolumeLiters - boilOffRatePerHour * (minutes / 60);
}

function calculateNewGravity(startVolume, startGravity, endVolume) {
  // turn a number like 1.056 => 56
  const startGravityPoints = startGravity * 1000 - 1000;
  const endGravityPoints = (startVolume * startGravityPoints) / endVolume;
  return endGravityPoints / 1000 + 1;
}

function _calculateBignessFactor(gravity) {
  /*
   https://realbeer.com/hops/research.html

  // Bigness factor = 1.65 * 0.000125^(wort gravity - 1)
  */

  return 1.65 * Math.pow(0.000125, gravity - 1);
}

function _calculateBoilTimeFactor(boilTime) {
  // Boil Time factor = 1 - e^(-0.04 * time in mins)
  //                  --------------------------
  //                            4.15
  return (1 - Math.pow(Math.E, -0.04 * boilTime)) / 4.15;
}

function calculateHopUtilisationFactor(gravity, minutes) {
  return _calculateBignessFactor(gravity) * _calculateBoilTimeFactor(minutes);
}

function calculateRequiredGrams(
  boilEndVolumeLiters,
  IBUs,
  alphaAcids,
  utilisationFactor
) {
  const mgLofAlphaAcids = IBUs / utilisationFactor;
  const decimalByWeightBy1000 = mgLofAlphaAcids * boilEndVolumeLiters;
  const decimalAlphaAcids = alphaAcids / 100;
  return decimalByWeightBy1000 / (decimalAlphaAcids * 1000);
}

function calculateIBU(
  weightGrams,
  utilisationFactor,
  alphaAcids,
  boilEndVolumeLiters
) {
  const decimalAlphaAcids = alphaAcids / 100;
  const mgLofAlphaAcids =
    (decimalAlphaAcids * weightGrams * 1000) / boilEndVolumeLiters;

  return utilisationFactor * mgLofAlphaAcids;
}

function compareFloats(f1, f2, error = 0.05) {
  return f1 - error <= f2 && f1 + error >= f2;
}

export {
  calculatePostBoilVolume,
  calculateNewGravity,
  calculateHopUtilisationFactor,
  calculateRequiredGrams,
  calculateIBU,
  compareFloats,
  createId,
  _calculateBignessFactor,
  _calculateBoilTimeFactor,
};
