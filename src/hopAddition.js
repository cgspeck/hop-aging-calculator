import React, { Component } from "react";

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

import {
  calculatePostBoilVolume,
  calculateNewGravity,
  calculateHopUtilisationFactor,
  calculateRequiredGrams,
  calculateIBU,
  compareFloats,
  createId,
} from "./util";

import { IBU_INTERMEDIATE_GRAVITY } from "./constants";

import ResultField from "./ResultFieldComponent";
import { debouncedInput } from "./debouncedInput";
const DebouncedTextField = debouncedInput(TextField, { timeout: 500 });

class HopAddition extends Component {
  constructor(props) {
    super(props);

    var hopRecord;

    if (props.initialHopRecord !== null) {
      hopRecord = props.initialHopRecord;
    } else {
      hopRecord = this.newHopRecord();
    }

    this.state = {
      hopRecord,
    };
  }

  newHopRecord() {
    const {
      ibuCalcMode,
      boilVolume,
      boilStartGravity,
      boilEndGravity,
      boilTime,
      recordNo,
      varieties,
    } = this.props;

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
    const { hopRecord } = this.state;
    this.props.onCloneHopAddition(hopRecord);
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

  hopVarietySelectCreateNewItem(recipeIndex, substitutionIndex) {
    return (
      <MenuItem
        value="newCustomHop"
        key="newCustomHop"
        onClick={this.props.onNewCustomHopClick.bind(
          this,
          recipeIndex,
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
      additionTime: isNaN(iValue) ? "" : fV,
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
    const { hopRecord } = this.state;
    const { baseVariety, substitutions } = hopRecord.variety;

    const newSubstitutions = substitutions.concat(
      this.newSubstitution(baseVariety)
    );

    this.setState({
      hopRecord: {
        ...hopRecord,
        substitutions: newSubstitutions,
      },
    });
  }

  onDeleteSubstituteRecord(index, hopRecordIndex) {
    var { hopRecords } = this.state;
    var hopRecord = hopRecords[hopRecordIndex];
    hopRecord.substitutions.splice(index, 1);
    this.setState({ hopRecords });
    this.calculateSubstitutionValuesForHopRecord(hopRecordIndex);
  }

  // TODO: resume here!!!
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
          <Grid item xs={11} md={3}>
            <DebouncedTextField
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
          <Grid item xs={12} md={3}>
            <DebouncedTextField
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
              inputProps={{ step: 0.1, min: 0 }}
              type="number"
            ></DebouncedTextField>
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
            <InputLabel>Storage Conditions</InputLabel>
            <Select
              value={substituteRecord.storageFactor}
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
          <Grid item xs={12} md={3}>
            <DebouncedTextField
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
                      value={substituteRecord.calculatedRequiredAmount.toFixed(
                        1
                      )}
                      postValue="gms"
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <ResultField
                      label="Age at Brew date"
                      value={substituteRecord.calculatedAge}
                      postValue="days"
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <ResultField
                      label="Estimated Alpha Acid"
                      postValue="%"
                      value={substituteRecord.calculatedEstimatedAA.toFixed(1)}
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <ResultField
                      label="Estimated IBU"
                      value={substituteRecord.calculatedIBU.toFixed(1)}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    {this.lowAAWarningMessage(substituteRecord)}
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Card>
    );
  }

  render() {
    const {
      additionTime,
      ibu,
      ibuRequirementSatisfied,
      intermediateGravity,
      name,
      variety,
      substitutions,
    } = this.hopRecord;
    const { index } = this.props;

    // TODO: calculate result fields
    //     if (!isNaN(fV)) {
    //   this.calculateSubstitutionValuesForHopRecord(hopRecordIndex);
    // }

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
                onClick={this.handleCloneHopAddition}
              >
                Copy
              </Button>
            </Grid>
            <Grid item xs={6} md={3}>
              {" "}
              <Button
                variant="contained"
                className="HopAdditionActionButtons"
                onClick={this.handleDeleteHopAddition}
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
                    {this.hopVarietySelectCreateNewItem(index, null)}
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
              {substitutions.map((r, i) => this.substituteTag(r, i))}
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
