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
import React, { Component } from "react";
import update from "immutability-helper";

import "fontsource-roboto";

import "./App.css";

// https://material-ui.com/components/material-icons/
import AddBox from "@material-ui/icons/AddBox";

import Container from "@material-ui/core/Container";
import Grid from "@material-ui/core/Grid";

import IconButton from "@material-ui/core/IconButton";
import LanguageIcon from "@material-ui/icons/Language";
import LinkedInIcon from "@material-ui/icons/LinkedIn";
import GitHubIcon from "@material-ui/icons/GitHub";

import TextField from "@material-ui/core/TextField";

import { MuiPickersUtilsProvider } from "@material-ui/pickers";
import LuxonUtils from "@date-io/luxon";
import { DatePicker } from "@material-ui/pickers";
import { DateTime, Interval } from "luxon";

import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";

import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";

import DialogTitle from "@material-ui/core/DialogTitle";
import InputAdornment from "@material-ui/core/InputAdornment";

import cloneDeep from "lodash.clonedeep";

import { DEFAULT_VARIETIES } from "./data";
import {
  calculatePostBoilVolume,
  calculateNewGravity,
  calculateHopUtilisationFactor,
  calculateRequiredGrams,
  calculateIBU,
  compareFloats,
  createId,
} from "./util";
import { IBU_INTERMEDIATE_GRAVITY, IBU_FINAL_GRAVITY } from "./constants";

import HopAddition from "./hopAddition";
import ResultField from "./ResultFieldComponent";
import { debouncedInput } from "./debouncedInput";
const DebouncedTextField = debouncedInput(TextField, { timeout: 500 });

class App extends Component {
  constructor() {
    super();
    const varieties = DEFAULT_VARIETIES;

    const ibuCalcMode = IBU_FINAL_GRAVITY;
    const boilStartGravity = 1.044;
    const boilVolume = 60.0;
    const boilOffRate = 11;
    const boilTime = 60;
    const boilEndVolume = calculatePostBoilVolume(
      boilVolume,
      boilOffRate,
      boilTime
    );

    const boilEndGravity = calculateNewGravity(
      boilVolume,
      boilStartGravity,
      boilEndVolume
    );

    const newHopHSI = 0.6;

    this.state = {
      brewDate: DateTime.local(),
      ibuCalcMode,
      boilTime,
      boilVolume,
      boilOffRate,
      boilEndVolume,
      boilStartGravity,
      boilEndGravity,
      hopRecords: {},
      newHopShouldOpen: false,
      newHopName: "",
      newHopHSI,
      newHopPercentLost: (Math.log(newHopHSI / 0.25) * 110) / 100,
      newHopRecipeIndex: null,
      newHopSubstitutionIndex: null,
      varieties,
      customVarieties: [],
    };

    this.state.initialHopRecord = this.newHopRecord();
    this.state.hopRecords = [createId()];

    this.customVarieties = [];
  }

  newHopRecord() {
    const {
      ibuCalcMode,
      boilVolume,
      boilStartGravity,
      boilEndGravity,
      boilTime,
      varieties,
    } = this.state;

    const recordNo =
      this.state.hopRecords.length === undefined
        ? 1
        : this.state.hopRecords.length + 1;

    const gravityForIBUCalc =
      ibuCalcMode === IBU_INTERMEDIATE_GRAVITY
        ? boilStartGravity
        : boilEndGravity;

    const utilisationFactor = calculateHopUtilisationFactor(
      gravityForIBUCalc,
      boilTime
    );

    const memo = {
      ibu: "",
      variety: varieties[0],
      additionTime: boilTime,
      intermediateVolume: boilVolume,
      intermediateGravity: boilStartGravity,
      gravityForIBUCalc,
      utilisationFactor,
      substitutions: [],
      ibuRequirementSatisfied: true,
      name: `Hop addition ${recordNo}`,
    };

    return memo;
  }

  calculateBoilEndVolume() {
    const { boilVolume, boilOffRate, boilTime } = this.state;

    const boilEndVolume = calculatePostBoilVolume(
      boilVolume,
      boilOffRate,
      boilTime
    );
    this.setState({
      boilEndVolume,
    });
    this.calculateBoilEndGravity();
  }

  calculateBoilEndGravity() {
    const { boilVolume, boilStartGravity, boilEndVolume } = this.state;

    const boilEndGravity = calculateNewGravity(
      boilVolume,
      boilStartGravity,
      boilEndVolume
    );

    this.setState({
      boilEndGravity,
    });
  }

  onNewHopAddition(e) {
    const hopRecords = this.state.hopRecords;
    const newId = createId();
    const initialHopRecord = this.newHopRecord();

    this.setState({
      initialHopRecord,
      hopRecords: hopRecords.concat([newId]),
    });
  }

  onBrewDateChanged(brewDate) {
    this.setState({ brewDate });
  }

  onBoilVolumeChanged(e) {
    const value = e.target.value;
    const fV = parseFloat(value);

    this.setState({ boilVolume: isNaN(fV) ? "" : fV });

    if (!isNaN(fV)) {
      this.calculateBoilEndVolume();
    }
  }

  onBoilOffRateChanged(e) {
    const value = e.target.value;
    const fV = parseFloat(value);

    this.setState({ boilOffRate: isNaN(fV) ? value : fV });

    if (!isNaN(fV)) {
      this.calculateBoilEndVolume();
    }
  }

  onBoilTimeChanged(e) {
    const value = e.target.value;
    const fV = parseFloat(value);

    this.setState({ boilTime: isNaN(fV) ? value : fV });

    if (!isNaN(fV)) {
      this.calculateBoilEndVolume();
    }
  }

  onBoilStartGravityChanged(e) {
    const value = e.target.value;
    const fV = parseFloat(value);
    this.setState({ boilStartGravity: isNaN(fV) ? value : fV });
    if (!isNaN(fV)) {
      this.calculateBoilEndVolume();
    }
  }

  onIBUCalcModeChanged(e) {
    const ibuCalcMode = e.target.value;
    this.setState({ ibuCalcMode });
  }

  recipeControls() {
    const { boilVolume, boilEndVolume, boilOffRate, ibuCalcMode } = this.state;

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={3}>
          {" "}
          <DatePicker
            id="brew-date"
            label="Brew Date"
            format="dd/MM/yyyy"
            value={this.state.brewDate.toJSDate()}
            onChange={this.onBrewDateChanged.bind(this)}
            disablePast
          />
        </Grid>
        <Grid item xs={12} md={3}>
          <DebouncedTextField
            label="Boil Time"
            value={this.state.boilTime}
            onChange={this.onBoilTimeChanged.bind(this)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">minutes</InputAdornment>
              ),
            }}
            inputProps={{ step: 1, min: 0 }}
            type="number"
          ></DebouncedTextField>
        </Grid>
        <Grid item xs={12} md={3}>
          <DebouncedTextField
            label="Boil Start Gravity"
            value={this.state.boilStartGravity}
            onChange={this.onBoilStartGravityChanged.bind(this)}
            InputProps={{
              endAdornment: <InputAdornment position="end">SG</InputAdornment>,
            }}
            inputProps={{ step: 0.001, min: 0 }}
            type="number"
          ></DebouncedTextField>
        </Grid>
        <Grid item xs={12} md={3}>
          <DebouncedTextField
            label="Boil Volume"
            value={boilVolume}
            onChange={this.onBoilVolumeChanged.bind(this)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">liters</InputAdornment>
              ),
            }}
            inputProps={{ step: "any", min: 0 }}
            type="number"
          ></DebouncedTextField>
        </Grid>
        <Grid item xs={12} md={4}>
          <DebouncedTextField
            label="Boil Off Rate"
            value={boilOffRate}
            onChange={this.onBoilOffRateChanged.bind(this)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">liters/hour</InputAdornment>
              ),
            }}
            type="number"
            step="0.1"
            min="0"
          ></DebouncedTextField>
        </Grid>
        <Grid item xs={12} md={4}>
          <ResultField
            label="End volume"
            postValue="liters"
            value={boilEndVolume.toFixed(1)}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <ResultField
            label="Boil End Gravity"
            value={this.state.boilEndGravity.toFixed(3)}
            postValue="SG"
          />
        </Grid>
        <Grid item xs={12} md={12}>
          <InputLabel>IBU Calculation Mode</InputLabel>
          <Select
            value={ibuCalcMode}
            onChange={this.onIBUCalcModeChanged.bind(this)}
            id="IBUCalculationMode"
          >
            <MenuItem
              value={IBU_INTERMEDIATE_GRAVITY}
              key="0"
              id="modeIBUIntermediate"
            >
              Tinseth, intermediate gravity
            </MenuItem>
            <MenuItem value={IBU_FINAL_GRAVITY} key="1" id="modeIBUFinal">
              Tinseth, end boil gravity (e.g. BrewTarget)
            </MenuItem>
          </Select>
        </Grid>
        <Grid item xs={12}>
          <Button
            onClick={this.onNewHopAddition.bind(this)}
            color="primary"
            startIcon={<AddBox />}
            variant="contained"
            className="NewHopAdditionButton"
          >
            New Hop Addition
          </Button>
        </Grid>
      </Grid>
    );
  }

  onDeleteHopAddition(index) {
    var { hopRecords } = this.state;
    delete hopRecords[index];
    this.setState({
      hopRecords,
    });
  }

  onCloneHopAddition(index) {
    const { hopRecords } = this.state;
    const sourceRecord = hopRecords[index];
    const newId = createId();
    var newAdditionRecord = cloneDeep(sourceRecord);
    // don't want to create a new set of hop varieties because it will break select boxes
    newAdditionRecord.variety = sourceRecord.variety;
    newAdditionRecord.name = `Copy of ${sourceRecord.name}`;
    // eslint-disable-next-line array-callback-return
    newAdditionRecord.substitutions.map((substitutionRecord, i) => {
      substitutionRecord.variety = sourceRecord.substitutions[i].variety;
    });

    this.setState({
      hopRecords: {
        ...hopRecords,
        [newId]: newAdditionRecord,
      },
    });
  }

  calculateSubstitutionValuesForRecipe() {
    const { hopRecords } = this.state;

    // eslint-disable-next-line array-callback-return
    Object.entries(hopRecords).map(([key, _]) => {
      this.calculateIntermediateVolumeAndGravity(key);
      this.calculateSubstitutionValuesForHopRecord(key);
    });
  }

  calculateSubstitutionValuesForHopRecord(hopRecordIndex) {
    var { hopRecords } = this.state;
    const hopRecord = hopRecords[hopRecordIndex];
    if (hopRecord.substitutions.length > 0) {
      hopRecord.substitutions.map((_, i) =>
        this.calculateSubstitutionValuesForHopRecordAndSubstitution(
          i,
          hopRecordIndex
        )
      );
    } else {
      const ibu = hopRecord.ibu;
      hopRecords[hopRecordIndex].ibuRequirementSatisfied =
        ibu > 0 ? false : true;
    }
    this.setState({
      hopRecords,
    });
  }

  onSubstituteHopChanged(index, hopRecordIndex, e) {
    const value = e.target.value;
    var { hopRecords } = this.state;
    var hopRecord = hopRecords[hopRecordIndex];
    var substituteRecord = hopRecord.substitutions[index];
    substituteRecord.variety = value;
    this.setState({ hopRecords });
    this.calculateSubstitutionValuesForHopRecordAndSubstitution(
      index,
      hopRecordIndex
    );
  }

  calculateSubstitutionValuesForHopRecordAndSubstitution(
    index,
    hopRecordIndex
  ) {
    var { boilEndVolume, hopRecords } = this.state;
    var hopRecord = hopRecords[hopRecordIndex];
    var substituteRecord = hopRecord.substitutions[index];
    const brewDate = this.state.brewDate;
    const {
      ratedAlphaAcid,
      ratingDate,
      storageTemperature,
      storageFactor,
      maxAmount,
    } = substituteRecord;
    const interval = Interval.fromDateTimes(ratingDate, brewDate);

    var calculatedRequiredAmount = 0;
    var calculatedAge, calculatedIBU, estimatedAA;
    calculatedAge = interval.count("days") - 1;
    // https://mathbitsnotebook.com/Algebra1/FunctionGraphs/FNGTypeExponential.html
    // Math.pow(1 - 0.045, 20 - storageTemperature);
    const temperatureFactor = Math.pow(1 - 0.045, 20 - storageTemperature);
    // A O = (A N *100)/(100*%Lost)
    // k = (lnA o - lnA N )/180
    const { percentLost } = substituteRecord.variety;
    const invPercentLost = Math.abs(1.0 - percentLost);
    const An = 1.3;
    const A0 = (An * 100) / (100 * invPercentLost);
    const rateConstant = (Math.log(A0) - Math.log(An)) / 180;
    // future alpha = A*1/e(k*TF*SF*Days)
    estimatedAA =
      (ratedAlphaAcid * 1) /
      Math.exp(
        rateConstant * temperatureFactor * storageFactor * calculatedAge
      );

    if (estimatedAA < ratedAlphaAcid / 2) {
      substituteRecord.lowAAWarn = true;
    }

    if (maxAmount <= 0) {
      calculatedRequiredAmount = 0;
      calculatedIBU = 0;
    } else {
      const { utilisationFactor, ibu } = hopRecord;

      var calcIBURequirementSatisifed = false;
      // clip wanted ibu to total of this hop addition
      const existingIBUs = hopRecord.substitutions.reduce((acc, cur, idx) => {
        if (idx === index) {
          return acc + 0;
        } else {
          return acc + cur.calculatedIBU;
        }
      }, 0);
      var wantedIBU = ibu - existingIBUs;

      if (wantedIBU < 0) {
        wantedIBU = 0;
      }

      calculatedRequiredAmount = calculateRequiredGrams(
        boilEndVolume,
        wantedIBU,
        estimatedAA,
        utilisationFactor
      );

      if (calculatedRequiredAmount > maxAmount) {
        calculatedRequiredAmount = maxAmount;
      }

      calculatedIBU = calculateIBU(
        calculatedRequiredAmount,
        utilisationFactor,
        estimatedAA,
        boilEndVolume
      );

      if (compareFloats(calculatedIBU, wantedIBU)) {
        calcIBURequirementSatisifed = true;
      }
    }

    substituteRecord.calculatedRequiredAmount = calculatedRequiredAmount;
    substituteRecord.calculatedAge = calculatedAge;
    substituteRecord.calculatedIBU = calculatedIBU;
    substituteRecord.calculatedEstimatedAA = estimatedAA;
    hopRecord.ibuRequirementSatisfied = calcIBURequirementSatisifed;

    this.setState({ hopRecords });
  }

  onNewCustomHopClick(recipeIndex, substitutionIndex) {
    this.setState({
      newHopName: "New hop",
      newHopHSI: 0.5,
      newHopPercentLost: (Math.log(0.5 / 0.25) * 110) / 100,
      newHopShouldOpen: true,
      newHopRecipeIndex: recipeIndex,
      newHopSubstitutionIndex: substitutionIndex,
    });
  }

  onNewCustomHopDialogCancel() {
    const { newHopRecipeIndex, newHopSubstitutionIndex } = this.state;

    const hopRecords = this.state.hopRecords;
    var record = hopRecords[newHopRecipeIndex];

    if (newHopSubstitutionIndex === null) {
      record.variety = this.varieties[0];
    } else {
      record.substitutions[newHopSubstitutionIndex].variety = this.varieties[0];
    }

    this.setState({
      newHopShouldOpen: false,
      hopRecords: update(hopRecords, {
        [newHopRecipeIndex]: { $set: record },
      }),
    });
  }

  onNewCustomHopDialogSave() {
    const { newHopName, newHopPercentLost } = this.state;
    const newCustomHop = {
      name: newHopName,
      percentLost: newHopPercentLost,
    };
    this.customVarieties.push(newCustomHop);
    const { newHopRecipeIndex, newHopSubstitutionIndex } = this.state;

    const hopRecords = this.state.hopRecords;
    var record = hopRecords[newHopRecipeIndex];
    record.variety = this.varieties[0];

    if (newHopSubstitutionIndex === null) {
      record.variety = newCustomHop;
    } else {
      record.substitutions[newHopSubstitutionIndex].variety = newCustomHop;
    }

    this.setState({
      newHopShouldOpen: false,
      hopRecords: update(hopRecords, {
        [newHopRecipeIndex]: { $set: record },
      }),
    });
  }

  onCustomHopNameChange(e) {
    const newHopName = e.target.value;
    this.setState({ newHopName });
  }

  onCustomHopHSIChange(e) {
    const newHopHSI = e.target.value;
    const newHopPercentLost = (Math.log(newHopHSI / 0.25) * 110) / 100;
    this.setState({ newHopHSI, newHopPercentLost });
  }

  newCustomHopDialogTags() {
    return (
      <Dialog open={this.state.newHopShouldOpen}>
        <DialogTitle>New Custom Hop</DialogTitle>
        <DialogContent>
          <DebouncedTextField
            autoFocus
            margin="dense"
            label="Name"
            value={this.state.newHopName}
            onChange={this.onCustomHopNameChange.bind(this)}
            fullWidth
          />
          <DebouncedTextField
            autoFocus
            margin="dense"
            label="Hop Storage Index Percentage"
            value={this.state.newHopHSI}
            onChange={this.onCustomHopHSIChange.bind(this)}
            InputProps={{
              endAdornment: <InputAdornment position="end">%</InputAdornment>,
            }}
            type="number"
            fullWidth
          />
          <ResultField
            label="Percent Lost"
            value={this.state.newHopPercentLost.toFixed(2)}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={this.onNewCustomHopDialogCancel.bind(this)}
            color="primary"
          >
            Cancel
          </Button>
          <Button
            onClick={this.onNewCustomHopDialogSave.bind(this)}
            color="primary"
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  calculateIntermediateVolumeAndGravity(hopRecordIndex) {
    const {
      boilTime,
      boilVolume,
      boilStartGravity,
      boilEndGravity,
      boilOffRate,
      ibuCalcMode,
    } = this.state;

    const { hopRecords } = this.state;
    var record = hopRecords[hopRecordIndex];
    const { additionTime } = record;

    const intermediateVolume = calculatePostBoilVolume(
      boilVolume,
      boilOffRate,
      boilTime - additionTime
    );
    record.intermediateVolume = intermediateVolume;

    const intermediateGravity = calculateNewGravity(
      boilVolume,
      boilStartGravity,
      intermediateVolume
    );

    record.intermediateGravity = intermediateGravity;

    var gravityForIBUCalc;

    if (ibuCalcMode === IBU_INTERMEDIATE_GRAVITY) {
      gravityForIBUCalc = intermediateGravity;
    } else {
      gravityForIBUCalc = boilEndGravity;
    }

    const utilisationFactor = calculateHopUtilisationFactor(
      gravityForIBUCalc,
      additionTime
    );

    record.gravityForIBUCalc = gravityForIBUCalc;
    record.utilisationFactor = utilisationFactor;

    this.setState({
      hopRecords: update(hopRecords, {
        [hopRecordIndex]: { $set: record },
      }),
    });
  }

  hopRecordsTags() {
    const {
      hopRecords,
      boilStartGravity,
      boilVolume,
      boilOffRate,
      ibuCalcMode,
      boilEndGravity,
      boilTime,
      initialHopRecord,
      customVarieties,
      varieties,
    } = this.state;

    const baseProps = {
      boilStartGravity,
      boilVolume,
      boilOffRate,
      ibuCalcMode,
      boilEndGravity,
      boilTime,
      varieties,
      initialHopRecord,
      customVarieties,
    };

    return (
      <Container>
        {Object.entries(hopRecords).map(([_, value]) => (
          <HopAddition
            index={value}
            {...baseProps}
            onNewCustomHopClick={() => {}}
            key={value}
          />
        ))}
      </Container>
    );
  }

  render() {
    return (
      <MuiPickersUtilsProvider utils={LuxonUtils}>
        <div className="App">
          <Container>
            <h1>Hop Aging Calculator</h1>
            <p>
              &copy; Chris Speck and licensed under the{" "}
              <a
                href="https://spdx.org/licenses/AGPL-3.0-or-later.html"
                target="_blank"
                rel="noopener noreferrer"
              >
                AGPL-3.0-or-later license
              </a>
              , use at your own risk.
            </p>

            <a
              href="https://www.chrisspeck.com"
              className="IconLink"
              target="_blank"
              rel="noopener noreferrer"
            >
              <IconButton>
                <LanguageIcon />
              </IconButton>
            </a>

            <a
              href="https://github.com/cgspeck"
              className="IconLink"
              target="_blank"
              rel="noopener noreferrer"
            >
              <IconButton>
                <GitHubIcon />
              </IconButton>
            </a>

            <a
              href="https://www.linkedin.com/in/cgspeck/"
              className="IconLink"
              target="_blank"
              rel="noopener noreferrer"
            >
              <IconButton>
                <LinkedInIcon />
              </IconButton>
            </a>

            <p>
              Want instructions or more information? <br />
              <a
                href="https://github.com/cgspeck/hop-aging-calculator#how-to-use"
                target="_blank"
                rel="noopener noreferrer"
              >
                Click here.
              </a>
            </p>

            <Grid container spacing={1}>
              {this.recipeControls()}
              {this.hopRecordsTags()}
            </Grid>
          </Container>
          {this.newCustomHopDialogTags()}
        </div>
      </MuiPickersUtilsProvider>
    );
  }
}

export default App;
