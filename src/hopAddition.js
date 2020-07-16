import React, { Component } from "react";

// https://material-ui.com/components/material-icons/
import AddBox from "@material-ui/icons/AddBox";

import Button from "@material-ui/core/Button";
import CancelIcon from "@material-ui/icons/Cancel";
import Card from "@material-ui/core/Card";
import CardContent from "@material-ui/core/CardContent";
import Check from "@material-ui/icons/Check";
import FormControl from "@material-ui/core/FormControl";
import Grid from "@material-ui/core/Grid";
import InputAdornment from "@material-ui/core/InputAdornment";
import InputLabel from "@material-ui/core/InputLabel";
import MenuItem from "@material-ui/core/MenuItem";
import TextField from "@material-ui/core/TextField";
import Select from "@material-ui/core/Select";

import { DateTime, Interval } from "luxon";
import { DatePicker } from "@material-ui/pickers";

import {
  calculatePostBoilVolume,
  calculateNewGravity,
  calculateHopUtilisationFactor,
  calculateRequiredGrams,
  calculateIBU,
  compareFloats,
  createId,
  updateArray,
} from "./util";

import { IBU_INTERMEDIATE_GRAVITY } from "./constants";

import LowAAWarning from "./lowAAWarning";
import ResultField from "./ResultFieldComponent";
import { debouncedInput } from "./debouncedInput";
const DebouncedTextField = debouncedInput(TextField, { timeout: 500 });

class HopAddition extends Component {
  constructor(props) {
    super(props);
    console.log("const", props);
    this.state = {
      hopRecord: props.initialHopRecord,
      substitutions: props.initialSubstitutions,
    };
    console.log("const state", this.state);
  }

  onHopAdditionNameChange(e) {
    const value = e.target.value;

    const { hopRecord } = this.state;

    const updatedRecord = {
      ...hopRecord,
      name: value,
    };

    this.setState({
      hopRecord: updatedRecord,
    });
  }

  onIBUChange(e) {
    const value = e.target.value;
    const fV = parseFloat(value);
    if (isNaN(fV) && value !== "") {
      return;
    }
    const { hopRecord } = this.state;
    const updatedRecord = {
      ...hopRecord,
      ibu: isNaN(fV) ? "" : fV,
    };

    this.setState({
      hopRecord: updatedRecord,
    });
  }

  handleCloneHopAddition() {
    const { hopRecord, substitutions } = this.state;
    console.log("handleCloneHopAddition", hopRecord);
    this.props.onCloneHopAddition(hopRecord, substitutions);
  }

  handleDeleteHopAddition() {
    const { index } = this.props;
    this.props.onDeleteHopAddition(index);
  }

  hopAdditionIBUStatusTag(ibuRequirementSatisfied) {
    if (ibuRequirementSatisfied === true) {
      return <Check className="IBUSatisifed"></Check>;
    } else {
      return <p className="IBUUnsatisifed">Insufficient substitute hops!</p>;
    }
  }

  hopVarietySelectDefaultItems() {
    const { varieties } = this.props;
    return varieties.map((r, i) => (
      <MenuItem value={r} key={i}>
        {r.name}
      </MenuItem>
    ));
  }

  hopVarietySelectCustomItems() {
    const varieties = this.props.customVarieties;
    return varieties.map((r, i) => (
      <MenuItem value={r} key={i}>
        {r.name}
      </MenuItem>
    ));
  }

  hopVarietySelectCreateNewItem(substitutionIndex) {
    const { index } = this.props;
    return (
      <MenuItem
        value="newCustomHop"
        key="newCustomHop"
        onClick={this.props.onNewCustomHopClick.bind(
          this,
          index,
          substitutionIndex
        )}
      >
        --- New Custom Hop... ---
      </MenuItem>
    );
  }

  onAdditionTimeChange(e) {
    const value = e.target.value;
    const iValue = parseInt(value, 10);
    if (isNaN(iValue) && value !== "") {
      return;
    }

    const { boilTime } = this.state;
    if (iValue > boilTime) {
      return;
    }

    const { hopRecord } = this.state;

    const updatedRecord = {
      ...hopRecord,
      additionTime: isNaN(iValue) ? "" : iValue,
    };
    this.setState({
      hopRecord: updatedRecord,
    });
  }

  onAdditionHopChanged(e) {
    const value = e.target.value;
    const { hopRecord } = this.state;

    const updatedRecord = {
      ...hopRecord,
      variety: value,
    };
    this.setState({
      hopRecord: updatedRecord,
    });
  }

  aromaUseWarningTag(additionTime) {
    if (additionTime <= 0) {
      return (
        <p className="IBUUnsatisifed">Calculations not for aroma additions</p>
      );
    }
  }

  newSubstitution(baseVariety) {
    const ratingDate = DateTime.local().minus({ days: 1 });
    return {
      maxAmount: "",
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

  onAddHopSubstitution() {
    const { hopRecord, substitutions } = this.state;
    const { variety } = hopRecord;

    const newSubstitutions = substitutions.concat(
      this.newSubstitution(variety)
    );

    this.setState({
      substitutions: newSubstitutions,
    });
  }

  onDeleteSubstituteRecord(index) {
    const { hopRecord } = this.state;
    const { substitutions } = hopRecord;

    const newSubstitutiuons = substitutions.filter((_, i) => i !== index);

    this.setState({
      hopRecord: {
        ...hopRecord,
        substitutions: newSubstitutiuons,
      },
    });
  }

  updateSubstituteParamToFloatOrEmpty(index, e, key) {
    const value = e.target.value;
    const fV = parseFloat(value);
    if (isNaN(fV) && value !== "") {
      return;
    }
    this.updateSubstituteParamToValue(index, isNaN(fV) ? "" : fV, key);
  }

  updateSubstituteParamToValue(index, value, key) {
    const { substitutions } = this.state;
    const substituteRecord = substitutions[index];
    const newSubstituteRecord = {
      ...substituteRecord,
      [key]: value,
    };

    console.log("newSubstitutions set prv", substitutions);
    const newSubstitutions = updateArray(
      substitutions,
      index,
      newSubstituteRecord
    );

    console.log("newSubstitutions set val", newSubstitutions);

    this.setState({
      substitutions: newSubstitutions,
    });
  }

  onSubstituteMaxAmountChanged(index, e) {
    this.updateSubstituteParamToFloatOrEmpty(index, e, "maxAmount");
  }

  onSubstituteRatedAlphaAcidChanged(index, e) {
    this.updateSubstituteParamToFloatOrEmpty(index, e, "ratedAlphaAcid");
  }

  onSubstituteRatingDateChanged(index, e) {
    this.updateSubstituteParamToValue(index, e, "ratingDate");
  }

  onSubstituteStorageFactorChanged(index, e) {
    const value = e.target.value;
    this.updateSubstituteParamToValue(index, value, "storageFactor");
  }

  onSubstituteStorageTemperatureChanged(index, e) {
    this.updateSubstituteParamToFloatOrEmpty(index, e, "storageTemperature");
  }

  onSubstituteHopChanged(index, e) {
    // const value = e.target.value;
    // var { hopRecords } = this.state;
    // var hopRecord = hopRecords[hopRecordIndex];
    // var substituteRecord = hopRecord.substitutions[index];
    // substituteRecord.variety = value;
    // this.setState({ hopRecords });
    // this.calculateSubstitutionValuesForHopRecordAndSubstitution(
    //   index,
    //   hopRecordIndex
    // );
  }

  // TODO: resume here!!!
  substituteTag(substituteRecord, index, substitutuionResults) {
    const {
      maxAmount,
      ratedAlphaAcid,
      variety,
      ratingDate,
      storageFactor,
      storageTemperature,
    } = substituteRecord;
    const {
      calculatedRequiredAmount,
      calculatedAge,
      calculatedIBU,
      estimatedAA,
      lowAAWarn,
    } = substitutuionResults;
    console.log(this.state);
    console.log(substituteRecord, substitutuionResults);
    return (
      <Card variant="outlined" className="SubstituteCard" key={`${index}`}>
        <Grid container spacing={1}>
          <Grid item xs={1} md={1}>
            <CancelIcon
              onClick={this.onDeleteSubstituteRecord.bind(this, index)}
              className="SubstutionCancelIcon"
              color="secondary"
            />
          </Grid>
          <Grid item xs={11} md={3}>
            <DebouncedTextField
              label="Up to"
              value={maxAmount}
              onChange={this.onSubstituteMaxAmountChanged.bind(this, index)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">gms</InputAdornment>
                ),
              }}
              inputProps={{ step: "any", min: 0 }}
              type="number"
              className="SubstitutionWeightField"
              autoFocus
            ></DebouncedTextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl>
              <InputLabel>Substitute Variety</InputLabel>
              <Select
                value={variety}
                onChange={this.onSubstituteHopChanged.bind(this, index)}
              >
                {this.hopVarietySelectCustomItems()}
                {this.hopVarietySelectCreateNewItem(index)}
                {this.hopVarietySelectDefaultItems()}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <DebouncedTextField
              label="Rated"
              value={ratedAlphaAcid}
              onChange={this.onSubstituteRatedAlphaAcidChanged.bind(
                this,
                index
              )}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">% alpha acids</InputAdornment>
                ),
              }}
              inputProps={{ step: 0.1, min: 0 }}
              type="number"
            ></DebouncedTextField>
          </Grid>
          <Grid item xs={12} md={3}>
            <DatePicker
              label="Rating Date"
              format="dd/MM/yyyy"
              value={ratingDate.toJSDate()}
              onChange={this.onSubstituteRatingDateChanged.bind(this, index)}
              disableFuture
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <InputLabel>Storage Conditions</InputLabel>
            <Select
              value={storageFactor}
              onChange={this.onSubstituteStorageFactorChanged.bind(this, index)}
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
          <Grid item xs={12} md={3}>
            <DebouncedTextField
              label="Storage Temperature"
              value={storageTemperature}
              onChange={this.onSubstituteStorageTemperatureChanged.bind(
                this,
                index
              )}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">&deg;c</InputAdornment>
                ),
              }}
              inputProps={{ max: 20, min: -30 }}
              type="number"
            ></DebouncedTextField>
          </Grid>
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Grid container spacing={1}>
                  <Grid item xs={12} md={3}>
                    <ResultField
                      label="Required Amount"
                      value={(calculatedRequiredAmount || 0).toFixed(1)}
                      postValue="gms"
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <ResultField
                      label="Age at Brew date"
                      value={calculatedAge}
                      postValue="days"
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <ResultField
                      label="Estimated Alpha Acid"
                      postValue="%"
                      value={(estimatedAA || 0).toFixed(1)}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <ResultField
                      label="Estimated IBU"
                      value={(calculatedIBU || 0).toFixed(1)}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <LowAAWarning lowAAWarn={lowAAWarn} />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Card>
    );
  }

  calculateSubstitutionResults(
    utilisationFactor,
    ibu,
    ibuRunningTotal,
    substitutions,
    substituteRecordIdx
  ) {
    // var { boilEndVolume, hopRecords } = this.state;
    // var hopRecord = hopRecords[hopRecordIndex];

    const { brewDate, boilEndVolume } = this.props;
    const substituteRecord = substitutions[substituteRecordIdx];
    const {
      ratedAlphaAcid,
      ratingDate,
      storageTemperature,
      storageFactor,
      maxAmount,
    } = substituteRecord;
    console.log(ratingDate, brewDate);
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

    if (maxAmount <= 0) {
      calculatedRequiredAmount = 0;
      calculatedIBU = 0;
    } else {
      // const { utilisationFactor, ibu } = hopRecord;
      // clip wanted ibu to total of this hop addition
      // const existingIBUs = substitutions.reduce((acc, cur, idx) => {
      //   if (idx === substituteRecordIdx) {
      //     return acc + 0;
      //   } else {
      //     return acc + cur.calculatedIBU;
      //   }
      // }, 0);
      var wantedIBU = ibu - ibuRunningTotal;

      if (wantedIBU < 0) {
        wantedIBU = 0;
      }

      calculatedRequiredAmount = calculateRequiredGrams(
        boilEndVolume,
        wantedIBU,
        estimatedAA,
        utilisationFactor
      );

      console.log(
        "BBB",
        boilEndVolume,
        wantedIBU,
        estimatedAA,
        utilisationFactor
      );

      if (calculatedRequiredAmount > maxAmount) {
        calculatedRequiredAmount = maxAmount;
      }
      console.log(
        "AAA",
        calculatedRequiredAmount,
        utilisationFactor,
        estimatedAA,
        boilEndVolume
      );

      calculatedIBU = calculateIBU(
        calculatedRequiredAmount,
        utilisationFactor,
        estimatedAA,
        boilEndVolume
      );
    }

    const lowAAWarn = estimatedAA < ratedAlphaAcid / 2;

    return {
      calculatedRequiredAmount,
      calculatedAge,
      calculatedIBU,
      estimatedAA,
      lowAAWarn,
    };
  }

  render() {
    const { hopRecord, substitutions } = this.state;
    console.log("render substitutions", substitutions);
    const { additionTime, ibu, name, variety } = hopRecord;
    const {
      index,
      boilTime,
      boilVolume,
      boilOffRate,
      boilStartGravity,
      ibuCalcMode,
      boilEndGravity,
    } = this.props;

    const intermediateVolume = calculatePostBoilVolume(
      boilVolume,
      boilOffRate,
      boilTime - additionTime
    );

    const intermediateGravity = calculateNewGravity(
      boilVolume,
      boilStartGravity,
      intermediateVolume
    );

    const gravityForIBUCalc =
      ibuCalcMode === IBU_INTERMEDIATE_GRAVITY
        ? boilStartGravity
        : boilEndGravity;

    const utilisationFactor = calculateHopUtilisationFactor(
      gravityForIBUCalc,
      boilTime
    );

    var ibuRunningTotal = 0;

    const substitutuionResults = substitutions.map((_r, i) => {
      const memo = this.calculateSubstitutionResults(
        utilisationFactor,
        ibu,
        ibuRunningTotal,
        substitutions,
        i
      );
      ibuRunningTotal += memo.calculatedIBU;
      return memo;
    });

    console.log(substitutuionResults);
    // const ibuTotal = substitutuionResults.reduce((acc, cur, _idx) => {
    //   console.log(cur, _idx);
    //   return acc + cur.calculatedIBU;
    // }, 0);

    const ibuRequirementSatisfied = compareFloats(ibu, ibuRunningTotal);

    return (
      <Grid item xs={12} key={index}>
        <Card variant="outlined">
          <Grid container spacing={1}>
            <Grid item xs={12} md={6}>
              <DebouncedTextField
                value={name}
                onChange={this.onHopAdditionNameChange.bind(this)}
                className="HopNameTextField"
              ></DebouncedTextField>
            </Grid>
            <Grid item xs={6} md={3}>
              <Button
                variant="contained"
                className="HopAdditionActionButtons"
                onClick={this.handleCloneHopAddition.bind(this)}
              >
                Copy
              </Button>
            </Grid>
            <Grid item xs={6} md={3}>
              {" "}
              <Button
                variant="contained"
                className="HopAdditionActionButtons"
                onClick={this.handleDeleteHopAddition.bind(this)}
                color="secondary"
              >
                Delete
              </Button>
            </Grid>
          </Grid>
          <CardContent>
            <Grid container spacing={1}>
              <Grid item xs={12} md={3}>
                <DebouncedTextField
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">IBUs</InputAdornment>
                    ),
                  }}
                  label="Recipe calls for"
                  type="number"
                  inputProps={{ step: "any", min: 0 }}
                  value={ibu}
                  onChange={this.onIBUChange.bind(this)}
                  className="HopAdditionIBUField"
                  autoFocus
                ></DebouncedTextField>
                {this.hopAdditionIBUStatusTag(ibuRequirementSatisfied)}
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl>
                  <InputLabel>of hop</InputLabel>
                  <Select
                    value={variety}
                    onChange={this.onAdditionHopChanged.bind(this)}
                  >
                    {this.hopVarietySelectCustomItems()}
                    {this.hopVarietySelectCreateNewItem(null)}
                    {this.hopVarietySelectDefaultItems()}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <DebouncedTextField
                  label="at"
                  value={additionTime}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">minutes</InputAdornment>
                    ),
                  }}
                  type="number"
                  inputProps={{ step: 1, min: 0 }}
                  onChange={this.onAdditionTimeChange.bind(this)}
                ></DebouncedTextField>
                {this.aromaUseWarningTag(additionTime)}
              </Grid>
              <Grid item xs={12} md={3}>
                <ResultField
                  label="Intermediate Gravity"
                  value={intermediateGravity.toFixed(3)}
                  postValue="SG"
                />
              </Grid>
              <Grid item xs={12}>
                <h4>I will use the following for this addition:</h4>
              </Grid>
              <Grid item xs={12}>
                <Button
                  onClick={this.onAddHopSubstitution.bind(this)}
                  color="primary"
                  startIcon={<AddBox />}
                  variant="contained"
                >
                  New Row
                </Button>
              </Grid>
              {substitutions.map((r, i) =>
                this.substituteTag(r, i, substitutuionResults[i])
              )}
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    );
  }
}

/*

props:

- index
- boilStartGravity
- boilVolume
- boilOffRate
- ibuCalcMode
- boilEndGravity
- boilTime
- initialHopRecord
- initialSubstitutions
- varieties
- recordNo
- onCloneHopAddition
- onDeleteHopAddition
- customVarieties
- onNewCustomHopClick

*/

// HopAddition.defaultProps = {

// }

export default HopAddition;
