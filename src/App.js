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

import "fontsource-roboto";

import "./App.css";

import Container from "@material-ui/core/Container";
import Grid from "@material-ui/core/Grid";

import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";

// https://material-ui.com/components/material-icons/
import AddBox from "@material-ui/icons/AddBox";
import CancelIcon from "@material-ui/icons/Cancel";
import Check from "@material-ui/icons/Check";

import IconButton from "@material-ui/core/IconButton";
import LanguageIcon from "@material-ui/icons/Language";
import LinkedInIcon from "@material-ui/icons/LinkedIn";
import GitHubIcon from "@material-ui/icons/GitHub";

import TextField from "@material-ui/core/TextField";

import { MuiPickersUtilsProvider } from "@material-ui/pickers";
import LuxonUtils from "@date-io/luxon";
import { DatePicker } from "@material-ui/pickers";
import { DateTime, Duration, Interval } from "luxon";

import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";

import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";

import DialogTitle from "@material-ui/core/DialogTitle";
import InputAdornment from "@material-ui/core/InputAdornment";
import linkState from "linkstate";

import cloneDeep from "lodash.clonedeep";

import { DEFAULT_VARIETIES } from "./data";
import {
  calculatePostBoilVolume,
  calculateDilutedGravity,
  calculateHopUtilisationFactor,
  calculateRequiredGrams,
  calculateIBU,
  compareFloats,
} from "./util";

class App extends Component {
  constructor() {
    super();
    this.varieties = DEFAULT_VARIETIES;
    this.state = {
      boilTime: 60,
      brewDate: DateTime.local(),
      boilVolume: 60,
      boilOffRate: 11,
      boilStartGravity: 1.041,
      boilEndGravity: 1.05,
      hopRecords: [],
      newHopShouldOpen: false,
      newHopName: "",
      newHopHSI: 60.0,
      newHopRecipeIndex: null,
      newHopSubstitutionIndex: null,
    };
    this.state.hopRecords = [this.newHopRecord()];

    this.customVarieties = [];
  }

  newSubstitution(baseVariety) {
    const { brewDate } = this.state;

    const ratingDate = brewDate.minus(Duration.fromObject({ days: 1 }));
    return {
      maxAmount: 0.0,
      variety: baseVariety,
      ratedAlphaAcid: 4.5,
      ratingDate: ratingDate,
      storageFactor: 0.5,
      storageTemperature: -8.0,
      calculatedRequiredAmount: 0.0,
      calculatedAge: 0,
      calculatedEstimatedAA: 0.0,
      calculatedIBU: 0.0,
      lowAAWarn: false,
    };
  }

  newHopRecord() {
    const {
      boilVolume,
      boilStartGravity,
      boilEndGravity,
      boilTime,
    } = this.state;
    const utilisationFactor = calculateHopUtilisationFactor(
      boilStartGravity,
      boilEndGravity,
      boilTime
    );
    return {
      ibu: 0.0,
      variety: this.varieties[0],
      additionTime: boilTime,
      intermediateVolume: boilVolume,
      intermediateGravity: boilStartGravity,
      utilisationFactor,
      substitutions: [],
      ibuRequirementSatisfied: true,
    };
  }

  onAddHopRecord(e) {
    var hopRecords = this.state.hopRecords;
    hopRecords.push(this.newHopRecord());
    this.setState({ hopRecords: hopRecords });
  }

  onBrewDateChanged(brewDate) {
    this.setState({ brewDate });
    this.calculateSubstitutionValuesForRecipe();
  }

  recipeControls() {
    return (
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
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
        <Grid item xs={12} md={4}>
          <TextField
            label="Boil Time"
            value={this.state.boilTime}
            onChange={linkState(this, "boilTime")}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">minutes</InputAdornment>
              ),
            }}
            type="number"
          ></TextField>
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            label="Boil Start Gravity"
            value={this.state.boilStartGravity}
            onChange={linkState(this, "boilStartGravity")}
            InputProps={{
              endAdornment: <InputAdornment position="end">SG</InputAdornment>,
            }}
            type="number"
          ></TextField>
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            label="Boil Volume"
            value={this.state.boilVolume}
            onChange={linkState(this, "boilVolume")}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">liters</InputAdornment>
              ),
            }}
            type="number"
          ></TextField>
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            label="Boil Off Rate"
            value={this.state.boilOffRate}
            onInput={linkState(this, "boilOffRate")}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">liters/hour</InputAdornment>
              ),
            }}
            type="number"
          ></TextField>
        </Grid>
        <Grid item xs={12} md={4}>
          <TextField
            label="Boil End Gravity"
            value={this.state.boilEndGravity}
            onChange={linkState(this, "boilEndGravity")}
            InputProps={{
              endAdornment: <InputAdornment position="end">SG</InputAdornment>,
            }}
            type="number"
          ></TextField>
        </Grid>
        <Grid item xs={12}>
          <Button
            onClick={this.onAddHopRecord.bind(this)}
            color="primary"
            startIcon={<AddBox />}
          >
            New Hop Addition
          </Button>
        </Grid>
      </Grid>
    );
  }

  onDeleteHopAddition(index) {
    var { hopRecords } = this.state;
    hopRecords.splice(index, 1);
    this.setState({
      hopRecords,
    });
  }

  onCloneHopAddition(index) {
    var { hopRecords } = this.state;
    const sourceRecord = hopRecords[index];
    var newAdditionRecord = cloneDeep(sourceRecord);
    // don't want to create a new set of hop varieties because it will break select boxes
    newAdditionRecord.variety = sourceRecord.variety;

    // eslint-disable-next-line array-callback-return
    newAdditionRecord.substitutions.map((substitutionRecord, i) => {
      substitutionRecord.variety = sourceRecord.substitutions[i].variety;
    });

    hopRecords.push(newAdditionRecord);
    this.setState({
      hopRecords,
    });
  }

  onAddHopSubstitution(index) {
    var { hopRecords } = this.state;
    var hopRecord = hopRecords[index];
    const baseVariety = hopRecord.variety;
    hopRecords[index].substitutions.push(this.newSubstitution(baseVariety));

    this.setState({
      hopRecords,
    });
  }

  calculateSubstitutionValuesForRecipe() {
    const { hopRecords } = this.state;
    if (hopRecords.length > 0) {
      hopRecords.map((_, i) => this.calculateSubstitutionValuesForHopRecord(i));
    }
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

  onIBUChange(hopRecordIndex, e) {
    const value = e.target.value;
    const fV = parseFloat(value);
    if (isNaN(fV) && value !== "") {
      return;
    }
    var { hopRecords } = this.state;
    hopRecords[hopRecordIndex].ibu = isNaN(fV) ? "" : fV;
    this.setState({ hopRecords });

    if (!isNaN(fV)) {
      this.calculateSubstitutionValuesForHopRecord(hopRecordIndex);
    }
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

  onSubstituteMaxAmountChanged(index, hopRecordIndex, e) {
    const value = e.target.value;
    const fV = parseFloat(value);
    if (isNaN(fV) && value !== "") {
      return;
    }
    var { hopRecords } = this.state;
    var hopRecord = hopRecords[hopRecordIndex];
    var substituteRecord = hopRecord.substitutions[index];
    substituteRecord.maxAmount = isNaN(fV) ? "" : fV;
    this.setState({ hopRecords });
    if (!isNaN(fV)) {
      this.calculateSubstitutionValuesForHopRecordAndSubstitution(
        index,
        hopRecordIndex
      );
    }
  }

  onSubstituteRatedAlphaAcidChanged(index, hopRecordIndex, e) {
    const value = e.target.value;
    const fV = parseFloat(value);
    if (isNaN(fV) && value !== "") {
      return;
    }
    var { hopRecords } = this.state;
    var hopRecord = hopRecords[hopRecordIndex];
    var substituteRecord = hopRecord.substitutions[index];
    substituteRecord.ratedAlphaAcid = isNaN(fV) ? "" : fV;
    this.setState({ hopRecords });
    if (!isNaN(fV)) {
      this.calculateSubstitutionValuesForHopRecordAndSubstitution(
        index,
        hopRecordIndex
      );
    }
  }

  onSubstituteStorageTemperatureChanged(index, hopRecordIndex, e) {
    const value = e.target.value;
    const fV = parseFloat(value);
    if (isNaN(fV) && value !== "") {
      return;
    }
    var { hopRecords } = this.state;
    var hopRecord = hopRecords[hopRecordIndex];
    var substituteRecord = hopRecord.substitutions[index];
    substituteRecord.storageTemperature = isNaN(fV) ? "" : fV;
    this.setState({ hopRecords });
    if (!isNaN(fV)) {
      this.calculateSubstitutionValuesForHopRecordAndSubstitution(
        index,
        hopRecordIndex
      );
    }
  }

  onSubstituteRatingDateChanged(index, hopRecordIndex, e) {
    const value = e;
    var { hopRecords } = this.state;
    var hopRecord = hopRecords[hopRecordIndex];
    var substituteRecord = hopRecord.substitutions[index];
    substituteRecord.ratingDate = value;
    this.setState({ hopRecords });
    this.calculateSubstitutionValuesForHopRecordAndSubstitution(
      index,
      hopRecordIndex
    );
  }

  onSubstituteStorageFactorChanged(index, hopRecordIndex, e) {
    const value = e.target.value;
    var { hopRecords } = this.state;
    var hopRecord = hopRecords[hopRecordIndex];
    var substituteRecord = hopRecord.substitutions[index];
    substituteRecord.storageFactor = value;
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
    var { hopRecords } = this.state;
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
    var calculatedAge, calculatedIBU, calculatedEstimatedAA;
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
    calculatedEstimatedAA =
      (ratedAlphaAcid * 1) /
      Math.exp(
        rateConstant * temperatureFactor * storageFactor * calculatedAge
      );

    if (calculatedEstimatedAA < ratedAlphaAcid / 2) {
      substituteRecord.lowAAWarn = true;
    }

    if (maxAmount <= 0) {
      calculatedRequiredAmount = 0;
      calculatedIBU = 0;
    } else {
      const {
        intermediateVolume,
        intermediateGravity,
        utilisationFactor,
        ibu,
      } = hopRecord;

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
        intermediateVolume,
        intermediateGravity,
        wantedIBU,
        calculatedEstimatedAA,
        utilisationFactor
      );

      if (calculatedRequiredAmount > maxAmount) {
        calculatedRequiredAmount = maxAmount;
      }

      calculatedIBU = calculateIBU(
        calculatedRequiredAmount,
        utilisationFactor,
        calculatedEstimatedAA,
        intermediateVolume,
        intermediateGravity
      );

      if (compareFloats(calculatedIBU, wantedIBU)) {
        calcIBURequirementSatisifed = true;
      }
    }

    substituteRecord.calculatedRequiredAmount = calculatedRequiredAmount;
    substituteRecord.calculatedAge = calculatedAge;
    substituteRecord.calculatedIBU = calculatedIBU;
    substituteRecord.calculatedEstimatedAA = calculatedEstimatedAA;
    hopRecord.ibuRequirementSatisfied = calcIBURequirementSatisifed;

    this.setState({ hopRecords });
  }

  lowAAWarningMessage(substituteRecord) {
    if (substituteRecord.lowAAWarn === true)
      return (
        <div className="LowAAAlert">
          Less then half of rated alpha acids, you should consider disposing of
          it.
        </div>
      );
  }

  onDeleteSubstituteRecord(index, hopRecordIndex) {
    var { hopRecords } = this.state;
    var hopRecord = hopRecords[hopRecordIndex];
    hopRecord.substitutions.splice(index, 1);
    this.setState({ hopRecords });
    this.calculateSubstitutionValuesForHopRecord(hopRecordIndex);
  }

  substituteTag(substituteRecord, index, recipeIndex) {
    return (
      <Card
        variant="outlined"
        className="SubstituteCard"
        key={`${recipeIndex}_${index}`}
      >
        <Grid container spacing={1}>
          <Grid item xs={1} md={1}>
            <CancelIcon
              onClick={this.onDeleteSubstituteRecord.bind(
                this,
                index,
                recipeIndex
              )}
              className="SubstutionCancelIcon"
              color="secondary"
            />
          </Grid>
          <Grid item xs={11} md={1}>
            <TextField
              label="Up to"
              value={substituteRecord.maxAmount}
              onChange={this.onSubstituteMaxAmountChanged.bind(
                this,
                index,
                recipeIndex
              )}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">gms</InputAdornment>
                ),
              }}
              type="number"
            ></TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl>
              <InputLabel>Substitute Variety</InputLabel>
              <Select
                value={substituteRecord.variety}
                onChange={this.onSubstituteHopChanged.bind(
                  this,
                  index,
                  recipeIndex
                )}
              >
                {this.hopVarietySelectCustomItems()}
                {this.hopVarietySelectCreateNewItem(recipeIndex, index)}
                {this.hopVarietySelectDefaultItems()}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <TextField
              label="Rated"
              value={substituteRecord.ratedAlphaAcid}
              onChange={this.onSubstituteRatedAlphaAcidChanged.bind(
                this,
                index,
                recipeIndex
              )}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">% alpha acids</InputAdornment>
                ),
              }}
              type="number"
            ></TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <DatePicker
              label="Rating Date"
              format="dd/MM/yyyy"
              value={substituteRecord.ratingDate.toJSDate()}
              onChange={this.onSubstituteRatingDateChanged.bind(
                this,
                index,
                recipeIndex
              )}
              disableFuture
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Select
              value={substituteRecord.storageFactor}
              label="Storage conditions"
              onChange={this.onSubstituteStorageFactorChanged.bind(
                this,
                index,
                recipeIndex
              )}
            >
              <MenuItem value={0.5} key="0">
                Sealed under vacuum or inert atmosphere
              </MenuItem>
              <MenuItem value={0.75} key="1">
                Sealed but not free from oxygen
              </MenuItem>
              <MenuItem value={1.0} key="2">
                Not sealed or sealed in poly bags
              </MenuItem>
            </Select>
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Storage Temperature"
              value={substituteRecord.storageTemperature}
              onChange={this.onSubstituteStorageTemperatureChanged.bind(
                this,
                index,
                recipeIndex
              )}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">&deg;c</InputAdornment>
                ),
              }}
              type="number"
            ></TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              label="Required Amount"
              value={substituteRecord.calculatedRequiredAmount.toFixed(1)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">gms</InputAdornment>
                ),
              }}
              disabled={true}
            ></TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              label="Age at Brew date"
              value={substituteRecord.calculatedAge}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">days</InputAdornment>
                ),
              }}
              disabled={true}
            ></TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              label="Estimated Alpha Acid"
              InputProps={{
                endAdornment: <InputAdornment position="end">%</InputAdornment>,
              }}
              value={substituteRecord.calculatedEstimatedAA.toFixed(1)}
              disabled={true}
            ></TextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              label="Estimated IBU"
              value={substituteRecord.calculatedIBU.toFixed(1)}
              disabled={true}
            ></TextField>
          </Grid>
          <Grid item xs={12}>
            {this.lowAAWarningMessage(substituteRecord)}
          </Grid>
        </Grid>
      </Card>
    );
  }

  onNewCustomHopClick(recipeIndex, substitutionIndex) {
    this.setState({
      newHopName: "",
      newHopHSI: 50,
      newHopShouldOpen: true,
      newHopRecipeIndex: recipeIndex,
      newHopSubstitutionIndex: substitutionIndex,
    });
  }

  onNewCustomHopDialogCancel() {
    this.setState({ newHopShouldOpen: false });
  }

  onNewCustomHopDialogSave() {
    const hsi = this.state.newHopHSI / 100;
    const percentLost = Math.log(hsi / 0.25) * 110;
    const newCustomHop = {
      name: this.state.newHopName,
      percentLost,
    };
    this.customVarieties.push(newCustomHop);
    const { newHopRecipeIndex, newHopSubstitutionIndex } = this.state;

    var hopRecords = this.state.hopRecords;

    if (newHopSubstitutionIndex === null) {
      hopRecords[newHopRecipeIndex].variety = newCustomHop;
    } else {
      hopRecords[newHopRecipeIndex].substitutions[
        newHopSubstitutionIndex
      ].variety = newCustomHop;
    }
    this.setState({ newHopShouldOpen: false, hopRecords });
  }

  newCustomHopDialogTags() {
    return (
      <Dialog open={this.state.newHopShouldOpen}>
        <DialogTitle>New Custom Hop</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            value={this.state.newHopName}
            onInput={linkState(this, "newHopName")}
            fullWidth
          />
          <TextField
            autoFocus
            margin="dense"
            label="Hop Storage Index Percentage"
            value={this.state.newHopHSI}
            onInput={linkState(this, "newHopHSI")}
            InputProps={{
              endAdornment: <InputAdornment position="end">%</InputAdornment>,
            }}
            type="number"
            fullWidth
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

  hopVarietySelectCustomItems() {
    const varieties = this.customVarieties;
    return varieties.map((r, i) => (
      <MenuItem value={r} key={i}>
        {r.name}
      </MenuItem>
    ));
  }

  hopVarietySelectCreateNewItem(recipeIndex, substitutionIndex) {
    return (
      <MenuItem
        value="newCustomHop"
        key="newCustomHop"
        onClick={this.onNewCustomHopClick.bind(
          this,
          recipeIndex,
          substitutionIndex
        )}
      >
        --- New Custom Hop... ---
      </MenuItem>
    );
  }

  hopVarietySelectDefaultItems() {
    const varieties = DEFAULT_VARIETIES;
    return varieties.map((r, i) => (
      <MenuItem value={r} key={i}>
        {r.name}
      </MenuItem>
    ));
  }

  onRecipeHopChanged(index, e) {
    const value = e.target.value;
    var { hopRecords } = this.state;
    hopRecords[index].variety = value;
    this.setState({ hopRecords });
  }

  onAdditionTimeChange(index, e) {
    const value = e.target.value;
    const iValue = parseInt(value, 10);
    if (isNaN(iValue) && value !== "") {
      return;
    }

    const {
      boilTime,
      boilVolume,
      boilStartGravity,
      boilEndGravity,
      boilOffRate,
    } = this.state;
    if (iValue > boilTime) {
      return;
    }

    const { hopRecords } = this.state;
    var additionRecord = hopRecords[index];

    if (isNaN(iValue)) {
      additionRecord.additionTime = "";
      this.setState({ hopRecords });
      return;
    }

    if (iValue < 0) {
      return;
    }

    additionRecord.additionTime = iValue;

    const { additionTime } = additionRecord;

    const intermediateVolume = calculatePostBoilVolume(
      boilVolume,
      boilOffRate,
      boilTime - additionTime
    );
    additionRecord.intermediateVolume = intermediateVolume;

    const intermediateGravity = calculateDilutedGravity(
      boilVolume,
      boilStartGravity,
      intermediateVolume
    );
    additionRecord.intermediateGravity = intermediateGravity;

    const utilisationFactor = calculateHopUtilisationFactor(
      boilStartGravity,
      boilEndGravity,
      boilTime
    );

    additionRecord.utilisationFactor = utilisationFactor;

    this.setState({ hopRecords });
  }

  hopAdditionIBUStatusTag(ibuRequirementSatisfied) {
    if (ibuRequirementSatisfied === true) {
      return <Check className="IBUSatisifed"></Check>;
    } else {
      return <p className="IBUUnsatisifed">Insufficient substitute hops!</p>;
    }
  }

  aromaUseWarningTag(additionTime) {
    if (additionTime <= 0) {
      return (
        <p className="IBUUnsatisifed">Calculations not for aroma additions</p>
      );
    }
  }

  hopRecordTag(hopRecord, index) {
    const { ibuRequirementSatisfied } = hopRecord;

    return (
      <Grid item xs={12} key={index}>
        <Card variant="outlined">
          <Grid container spacing={1}>
            <Grid item xs={12} md={6}>
              <h2>Hop addition {index + 1}</h2>
            </Grid>
            <Grid item xs={6} md={3}>
              <Button
                variant="contained"
                className="HopAdditionActionButtons"
                onClick={this.onCloneHopAddition.bind(this, index)}
              >
                Clone
              </Button>
            </Grid>
            <Grid item xs={6} md={3}>
              {" "}
              <Button
                variant="contained"
                className="HopAdditionActionButtons"
                onClick={this.onDeleteHopAddition.bind(this, index)}
                color="secondary"
              >
                Delete
              </Button>
            </Grid>
          </Grid>
          <CardContent>
            <Grid container spacing={1}>
              <Grid item xs={12} md={3}>
                <TextField
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">IBUs</InputAdornment>
                    ),
                  }}
                  label="Recipe calls for"
                  type="number"
                  value={hopRecord.ibu}
                  onChange={this.onIBUChange.bind(this, index)}
                ></TextField>
                {this.hopAdditionIBUStatusTag(ibuRequirementSatisfied)}
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl>
                  <InputLabel>of hop</InputLabel>
                  <Select
                    value={hopRecord.variety}
                    onChange={this.onRecipeHopChanged.bind(this, index)}
                  >
                    {this.hopVarietySelectCustomItems()}
                    {this.hopVarietySelectCreateNewItem(index, null)}
                    {this.hopVarietySelectDefaultItems()}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  label="at"
                  value={hopRecord.additionTime}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">minutes</InputAdornment>
                    ),
                  }}
                  type="number"
                  onChange={this.onAdditionTimeChange.bind(this, index)}
                ></TextField>
                {this.aromaUseWarningTag(hopRecord.additionTime)}
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField
                  label="Intermediate Gravity"
                  value={hopRecord.intermediateGravity.toFixed(3)}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">SG</InputAdornment>
                    ),
                  }}
                  disabled={true}
                ></TextField>
              </Grid>
              <Grid item xs={12}>
                <h4>I will use the following for this addition:</h4>
              </Grid>
              <Grid item xs={12}>
                <Button
                  onClick={this.onAddHopSubstitution.bind(this, index)}
                  color="primary"
                  startIcon={<AddBox />}
                >
                  New Row
                </Button>
              </Grid>
              {hopRecord.substitutions.map((r, i) =>
                this.substituteTag(r, i, index)
              )}
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    );
  }

  hopRecordsTags() {
    const hopRecords = this.state.hopRecords;
    return (
      <Container>{hopRecords.map((r, i) => this.hopRecordTag(r, i))}</Container>
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
              <a href="https://spdx.org/licenses/AGPL-3.0-or-later.html">
                AGPL-3.0-or-later license
              </a>
              , use at your own risk.
            </p>

            <a href="https://www.chrisspeck.com" className="IconLink">
              <IconButton>
                <LanguageIcon />
              </IconButton>
            </a>

            <a href="https://github.com/cgspeck" className="IconLink">
              <IconButton>
                <GitHubIcon />
              </IconButton>
            </a>

            <a href="https://www.linkedin.com/in/cgspeck/" className="IconLink">
              <IconButton>
                <LinkedInIcon />
              </IconButton>
            </a>

            <p>
              Want instructions or more information? <br />
              <a href="https://github.com/cgspeck/hop-aging-calculator#how-to-use">
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
