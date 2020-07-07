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

function calculateDilutedGravity(startVolume, startGravity, endVolume) {
  // turn a number like 1.056 => 56
  const startGravityPoints = startGravity * 1000 - 1000;
  const endGravityPoints = (startVolume * startGravityPoints) / endVolume;
  return endGravityPoints / 1000 + 1;
}

function calculateBignessFactor(startGravity, endGravity) {
  // Bigness factor = 1.65 * 0.000125^(wort gravity - 1)
  const averageGravity = (startGravity + endGravity) / 2;
  return 1.65 * Math.pow(0.000125, averageGravity - 1);
}

function calculateBoilTimeFactor(boilTime) {
  // Boil Time factor = 1 - e^(-0.04 * time in mins)
  //                  --------------------------
  //                            4.15
  return (1 - Math.pow(Math.E, -0.04 * boilTime)) / 4.15;
}

function calculateHopUtilisationFactor(startGravity, endGravity, minutes) {
  return (
    calculateBignessFactor(startGravity, endGravity) *
    calculateBoilTimeFactor(minutes)
  );
}

function calculateGravityCorrectionFactor(gravity) {
  if (gravity > 1.05) {
    return 1 + (gravity - 1.05) / 2;
  } else {
    return 1;
  }
}

function calculateRequiredGrams(
  volumeLiters,
  gravity,
  IBU,
  alphaAcids,
  utilisationFactor
) {
  const gravityCorrectionFactor = calculateGravityCorrectionFactor(gravity);

  return (
    (volumeLiters * gravityCorrectionFactor * IBU) /
    (utilisationFactor * (alphaAcids / 100) * 1000)
  );
}

function calculateIBU(
  weightGrams,
  utilisationFactor,
  alphaAcids,
  volumeLiters,
  gravity
) {
  const gravityCorrectionFactor = calculateGravityCorrectionFactor(gravity);
  return (
    (weightGrams * utilisationFactor * (alphaAcids / 100) * 1000) /
    (volumeLiters * gravityCorrectionFactor)
  );
}

function compareFloats(f1, f2, error = 0.01) {
  return f1 - error <= f2 && f1 + error >= f2;
}

export {
  calculatePostBoilVolume,
  calculateDilutedGravity,
  calculateHopUtilisationFactor,
  calculateRequiredGrams,
  calculateIBU,
  compareFloats,
  createId,
};
