import React, { Component } from "react";

import "fontsource-roboto";

import "./App.css";

import Container from "@material-ui/core/Container";
import Grid from "@material-ui/core/Grid";

import Card from "@material-ui/core/Card";
import CardActions from "@material-ui/core/CardActions";
import CardContent from "@material-ui/core/CardContent";

// https://material-ui.com/components/material-icons/
import AddBox from "@material-ui/icons/AddBox";
import DeleteIcon from "@material-ui/icons/Delete";
import FileCopyIcon from "@material-ui/icons/FileCopy";
import CancelIcon from "@material-ui/icons/Cancel";
import Check from "@material-ui/icons/Check";
import Warning from "@material-ui/icons/Warning";

import TextField from "@material-ui/core/TextField";
// import InputAdornment from "@material-ui/core/InputAdornment";

import { MuiPickersUtilsProvider } from "@material-ui/pickers";
import LuxonUtils from "@date-io/luxon";
import { DatePicker } from "@material-ui/pickers";
import Interval from "luxon/src/interval.js";

import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";

import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
// import DialogContentText from "@material-ui/core/DialogContentText";
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
      brewDate: new Date(),
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

    // var dateOffset = 24 * 60 * 60 * 1000 * 5; //5 days
    // var myDate = new Date();
    // myDate.setTime(myDate.getTime() - dateOffset);

    var ratingDate = new Date();
    ratingDate.setDate(brewDate.getDate() - 1);
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

  recipeControls() {
    return (
      <Grid container spacing={3}>
        <Grid item xs={4}>
          {" "}
          <DatePicker
            id="brew-date"
            label="Brew Date"
            format="dd/MM/yyyy"
            value={this.state.brewDate}
            onChange={linkState(this, "brewDate")}
            disablePast
          />
        </Grid>
        <Grid item xs={4}>
          <TextField
            label="Boil Time"
            value={this.state.boilTime}
            onInput={linkState(this, "boilTime")}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">minutes</InputAdornment>
              ),
            }}
            type="number"
          ></TextField>
        </Grid>
        <Grid item xs={4}>
          <TextField
            label="Boil Start Gravity"
            value={this.state.boilStartGravity.toFixed(3)}
            onInput={linkState(this, "boilStartGravity")}
            InputProps={{
              endAdornment: <InputAdornment position="end">SG</InputAdornment>,
            }}
            type="number"
          ></TextField>
        </Grid>
        <Grid item xs={4}>
          <TextField
            label="Boil Volume"
            value={this.state.boilVolume}
            onInput={linkState(this, "boilVolume")}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">liters</InputAdornment>
              ),
            }}
            type="number"
          ></TextField>
        </Grid>
        <Grid item xs={4}>
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
        <Grid item xs={4}>
          <TextField
            label="Boil End Gravity"
            value={this.state.boilEndGravity.toFixed(3)}
            onInput={linkState(this, "boilEndGravity")}
            InputProps={{
              endAdornment: <InputAdornment position="end">SG</InputAdornment>,
            }}
            type="number"
          ></TextField>
        </Grid>
        <Grid item xs={12}>
          <AddBox color="primary" onClick={this.onAddHopRecord.bind(this)} />
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
    var newAdditionRecord = cloneDeep(hopRecords[index]);
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

  calculateSubstitutionValuesFromHopAddition(hopRecordIndex) {
    var { hopRecords } = this.state;
    const hopRecord = hopRecords[hopRecordIndex];
    if (hopRecord.substitutions.length > 0) {
      this.calculateSubstitutionValues(0, hopRecordIndex);
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
    const value = parseFloat(e.target.value);
    if (isNaN(value)) {
      return;
    }
    var { hopRecords } = this.state;
    hopRecords[hopRecordIndex].ibu = value;
    this.setState({ hopRecords });
    this.calculateSubstitutionValuesFromHopAddition(hopRecordIndex);
  }

  onSubstituteHopChanged(index, hopRecordIndex, e) {
    const value = e.target.value;
    var { hopRecords } = this.state;
    var hopRecord = hopRecords[hopRecordIndex];
    var substituteRecord = hopRecord.substitutions[index];
    substituteRecord.variety = value;
    this.setState({ hopRecords });
    this.calculateSubstitutionValues(index, hopRecordIndex);
  }

  onSubstituteMaxAmountChanged(index, hopRecordIndex, e) {
    const value = parseFloat(e.target.value);
    if (isNaN(value)) {
      return;
    }
    var { hopRecords } = this.state;
    var hopRecord = hopRecords[hopRecordIndex];
    var substituteRecord = hopRecord.substitutions[index];
    substituteRecord.maxAmount = value;
    this.setState({ hopRecords });
    this.calculateSubstitutionValues(index, hopRecordIndex);
  }

  onSubstituteRatingAAChanged(index, hopRecordIndex, e) {
    const value = parseFloat(e.target.value);
    if (isNaN(value)) {
      return;
    }
    var { hopRecords } = this.state;
    var hopRecord = hopRecords[hopRecordIndex];
    var substituteRecord = hopRecord.substitutions[index];
    substituteRecord.ratedAlphaAcid = value;
    this.setState({ hopRecords });
    this.calculateSubstitutionValues(index, hopRecordIndex);
  }

  onSubstituteStorageTemperatureChanged(index, hopRecordIndex, e) {
    const value = parseFloat(e.target.value);
    if (isNaN(value)) {
      return;
    }
    var { hopRecords } = this.state;
    var hopRecord = hopRecords[hopRecordIndex];
    var substituteRecord = hopRecord.substitutions[index];
    substituteRecord.storageTemperature = value;
    this.setState({ hopRecords });
    this.calculateSubstitutionValues(index, hopRecordIndex);
  }

  onSubstituteRatingDateChanged(index, hopRecordIndex, e) {
    const value = e;
    var { hopRecords } = this.state;
    var hopRecord = hopRecords[hopRecordIndex];
    var substituteRecord = hopRecord.substitutions[index];
    substituteRecord.ratingDate = value;
    this.setState({ hopRecords });
    this.calculateSubstitutionValues(index, hopRecordIndex);
  }

  onSubstituteStorageFactorChanged(index, hopRecordIndex, e) {
    const value = e.target.value;
    var { hopRecords } = this.state;
    var hopRecord = hopRecords[hopRecordIndex];
    var substituteRecord = hopRecord.substitutions[index];
    substituteRecord.storageFactor = value;
    this.setState({ hopRecords });
    this.calculateSubstitutionValues(index, hopRecordIndex);
  }

  calculateSubstitutionValues(index, hopRecordIndex) {
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
        <div>
          Less then half of rated alpha acids, you should consider disposing of
          it.
        </div>
      );
  }

  substituteTag(substituteRecord, index, recipeIndex) {
    return (
      <Grid container spacing={3} key={`${recipeIndex}_${index}`}>
        <Grid item xs={3}>
          <TextField
            label="Up to"
            value={substituteRecord.maxAmount}
            onChange={this.onSubstituteMaxAmountChanged.bind(
              this,
              index,
              recipeIndex
            )}
            InputProps={{
              endAdornment: <InputAdornment position="end">gms</InputAdornment>,
            }}
            type="number"
          ></TextField>
        </Grid>
        <Grid item xs={3}>
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
        <Grid item xs={3}>
          <TextField
            label="Rated"
            value={substituteRecord.ratedAlphaAcid}
            onChange={this.onSubstituteRatingAAChanged.bind(
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
        <Grid item xs={3}>
          <DatePicker
            label="Rating Date"
            format="dd/MM/yyyy"
            value={substituteRecord.ratingDate}
            onChange={this.onSubstituteRatingDateChanged.bind(
              this,
              index,
              recipeIndex
            )}
            disableFuture
          />
        </Grid>
        <Grid item xs={6}>
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
        <Grid item xs={6}>
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
        <Grid item xs={3}>
          <TextField
            label="Required Amount"
            value={substituteRecord.calculatedRequiredAmount.toFixed(1)}
            InputProps={{
              endAdornment: <InputAdornment position="end">gms</InputAdornment>,
            }}
          ></TextField>
        </Grid>
        <Grid item xs={3}>
          <TextField
            label="Age at Brew date"
            value={substituteRecord.calculatedAge}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">days</InputAdornment>
              ),
            }}
          ></TextField>
        </Grid>
        <Grid item xs={3}>
          <TextField
            label="Estimated Alpha Acid"
            InputProps={{
              endAdornment: <InputAdornment position="end">%</InputAdornment>,
            }}
            value={substituteRecord.calculatedEstimatedAA.toFixed(1)}
          ></TextField>
        </Grid>
        <Grid item xs={3}>
          <TextField
            label="Estimated IBU"
            value={substituteRecord.calculatedIBU.toFixed(1)}
          ></TextField>
        </Grid>
        <Grid item xs={1}>
          <CancelIcon />
        </Grid>
        <Grid item xs={11}>
          {this.lowAAWarningMessage(substituteRecord)}
        </Grid>
      </Grid>
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
    const newCustomHop = {
      name: this.state.newHopName,
      percentLost: this.state.newHopHSI / 100,
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
    const value = parseInt(e.target.value, 10);
    if (isNaN(value)) {
      return;
    }

    const {
      boilTime,
      boilVolume,
      boilStartGravity,
      boilEndGravity,
      boilOffRate,
    } = this.state;
    if (value > boilTime) {
      return;
    }

    if (value < 0) {
      return;
    }
    const { hopRecords } = this.state;
    var additionRecord = hopRecords[index];
    additionRecord.additionTime = value;

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
      return <Check></Check>;
    } else {
      return <Warning></Warning>;
    }
  }

  hopRecordTag(hopRecord, index) {
    const { ibuRequirementSatisfied } = hopRecord;

    return (
      <Grid item xs={12} key={index}>
        <Card variant="outlined">
          <h2>Hop addition {index + 1}</h2>
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={3}>
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
              <Grid item xs={3}>
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
              <Grid item xs={3}>
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
              </Grid>
              <Grid item xs={3}>
                <TextField
                  label="Intermediate Gravity"
                  value={hopRecord.intermediateGravity.toFixed(3)}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">SG</InputAdornment>
                    ),
                  }}
                ></TextField>
              </Grid>
              <Grid item xs={4}>
                <AddBox onClick={this.onAddHopSubstitution.bind(this, index)} />
              </Grid>
              <Grid item xs={4}>
                I will substitute:
              </Grid>
              {hopRecord.substitutions.map((r, i) =>
                this.substituteTag(r, i, index)
              )}
            </Grid>
          </CardContent>
          <CardActions>
            <FileCopyIcon
              color="primary"
              onClick={this.onCloneHopAddition.bind(this, index)}
            />
            <DeleteIcon
              color="secondary"
              onClick={this.onDeleteHopAddition.bind(this, index)}
            />
          </CardActions>
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
