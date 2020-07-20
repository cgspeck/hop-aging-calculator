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
import { DateTime } from "luxon";

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

import ReactGA from "react-ga";

import { DEFAULT_VARIETIES } from "./data";
import { calculatePostBoilVolume, calculateNewGravity, calculateHopUtilisationFactor, createId } from "./util";
import { IBU_INTERMEDIATE_GRAVITY, IBU_FINAL_GRAVITY } from "./constants";

import HopAddition from "./hopAddition";
import ResultField from "./ResultFieldComponent";
import { debouncedInput } from "./debouncedInput";
const DebouncedTextField = debouncedInput(TextField, { timeout: 500 });

class App extends Component {
  constructor() {
    super();
    const varieties = DEFAULT_VARIETIES;

    const ibuCalcMode = IBU_INTERMEDIATE_GRAVITY;
    const boilStartGravity = 1.044;
    const boilVolume = 60.0;
    const boilOffRate = 11;
    const boilTime = 60;
    const boilEndVolume = calculatePostBoilVolume(boilVolume, boilOffRate, boilTime);

    const boilEndGravity = calculateNewGravity(boilVolume, boilStartGravity, boilEndVolume);

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
    this.state.initialSubstitutions = [];
    this.state.hopRecords = [createId()];

    this.customVarieties = [];
  }

  componentDidMount() {
    if (process.env.NODE_ENV === "production") {
      ReactGA.initialize(process.env.REACT_APP_GA_CODE);
      ReactGA.pageview(window.location.pathname + window.location.search);
    }
  }

  newHopRecord() {
    const { ibuCalcMode, boilStartGravity, boilEndGravity, boilTime, varieties } = this.state;

    const recordNo = this.state.hopRecords.length === undefined ? 1 : this.state.hopRecords.length + 1;

    const gravityForIBUCalc = ibuCalcMode === IBU_INTERMEDIATE_GRAVITY ? boilStartGravity : boilEndGravity;

    const utilisationFactor = calculateHopUtilisationFactor(gravityForIBUCalc, boilTime);

    const memo = {
      ibu: "",
      variety: varieties[0],
      additionTime: boilTime,
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

    const boilEndVolume = calculatePostBoilVolume(boilVolume, boilOffRate, boilTime);
    this.setState({
      boilEndVolume,
    });
    this.calculateBoilEndGravity();
  }

  calculateBoilEndGravity() {
    const { boilVolume, boilStartGravity, boilEndVolume } = this.state;

    const boilEndGravity = calculateNewGravity(boilVolume, boilStartGravity, boilEndVolume);

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
      initialSubstitutions: [],
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
              endAdornment: <InputAdornment position="end">minutes</InputAdornment>,
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
              endAdornment: <InputAdornment position="end">liters</InputAdornment>,
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
              endAdornment: <InputAdornment position="end">liters/hour</InputAdornment>,
            }}
            type="number"
            step="0.1"
            min="0"
          ></DebouncedTextField>
        </Grid>
        <Grid item xs={12} md={4}>
          <ResultField label="End volume" postValue="liters" value={boilEndVolume.toFixed(1)} />
        </Grid>
        <Grid item xs={12} md={4}>
          <ResultField label="Boil End Gravity" value={this.state.boilEndGravity.toFixed(3)} postValue="SG" />
        </Grid>
        <Grid item xs={12} md={12}>
          <InputLabel>IBU Calculation Mode</InputLabel>
          <Select value={ibuCalcMode} onChange={this.onIBUCalcModeChanged.bind(this)} id="IBUCalculationMode">
            <MenuItem value={IBU_INTERMEDIATE_GRAVITY} key="0" id="modeIBUIntermediate">
              Tinseth, intermediate gravity
            </MenuItem>
            <MenuItem value={IBU_FINAL_GRAVITY} key="1" id="modeIBUFinal">
              Tinseth, end boil gravity (e.g. BrewTarget)
            </MenuItem>
          </Select>
        </Grid>
        <Grid item xs={12}>
          <Button onClick={this.onNewHopAddition.bind(this)} color="primary" startIcon={<AddBox />} variant="contained" className="NewHopAdditionButton">
            New Hop Addition
          </Button>
        </Grid>
      </Grid>
    );
  }

  onDeleteHopAddition(index) {
    const { hopRecords } = this.state;
    const newHopRecords = hopRecords.filter((v) => v !== index);
    this.setState({
      hopRecords: newHopRecords,
    });
  }

  onCloneHopAddition(srcHopRecord, srcSubstitutions) {
    const { hopRecords } = this.state;
    const newId = createId();
    var newAdditionRecord = cloneDeep(srcHopRecord);

    // don't want to create a new set of hop varieties because it will break select boxes
    newAdditionRecord.variety = srcHopRecord.variety;
    newAdditionRecord.name = `Copy of ${srcHopRecord.name}`;
    // eslint-disable-next-line array-callback-return
    newAdditionRecord.substitutions.map((substitutionRecord, i) => {
      substitutionRecord.variety = srcHopRecord.substitutions[i].variety;
    });

    this.setState({
      initialHopRecord: newAdditionRecord,
      initialSubstitutions: srcSubstitutions,
      hopRecords: hopRecords.concat([newId]),
    });
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
          <DebouncedTextField autoFocus margin="dense" label="Name" value={this.state.newHopName} onChange={this.onCustomHopNameChange.bind(this)} fullWidth />
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
          <ResultField label="Percent Lost" value={this.state.newHopPercentLost.toFixed(2)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={this.onNewCustomHopDialogCancel.bind(this)} color="primary">
            Cancel
          </Button>
          <Button onClick={this.onNewCustomHopDialogSave.bind(this)} color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  hopRecordsTags() {
    const {
      hopRecords,
      boilStartGravity,
      boilVolume,
      boilOffRate,
      boilEndVolume,
      brewDate,
      ibuCalcMode,
      boilEndGravity,
      boilTime,
      initialHopRecord,
      initialSubstitutions,
      customVarieties,
      varieties,
    } = this.state;

    const baseProps = {
      boilStartGravity,
      boilVolume,
      boilOffRate,
      brewDate,
      boilEndVolume,
      ibuCalcMode,
      boilEndGravity,
      boilTime,
      varieties,
      initialHopRecord,
      initialSubstitutions,
      customVarieties,
    };

    return (
      <Container>
        {Object.entries(hopRecords).map(([_, value]) => (
          <HopAddition
            index={value}
            {...baseProps}
            onNewCustomHopClick={() => {}}
            onCloneHopAddition={this.onCloneHopAddition.bind(this)}
            onDeleteHopAddition={this.onDeleteHopAddition.bind(this)}
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
              <a href="https://spdx.org/licenses/AGPL-3.0-or-later.html" target="_blank" rel="noopener noreferrer">
                AGPL-3.0-or-later license
              </a>
              , use at your own risk.
            </p>

            <p>
              Want instructions or more information? &nbsp;
              <a href="https://github.com/cgspeck/hop-aging-calculator#how-to-use" target="_blank" rel="noopener noreferrer">
                Click here
              </a>
            </p>

            <p>
              Checkout &nbsp;
              <a href="https://www.westgatebrewers.org/" target="_blank" rel="noopener noreferrer">
                Westgate Brewers
              </a>
              , my homebrew club.
            </p>

            <Grid container spacing={1}>
              {this.recipeControls()}
              {this.hopRecordsTags()}
            </Grid>
            <Container className="AppFooter">
              <a href="https://www.chrisspeck.com" className="IconLink" target="_blank" rel="noopener noreferrer">
                <IconButton>
                  <LanguageIcon />
                </IconButton>
              </a>
              <a href="https://github.com/cgspeck" className="IconLink" target="_blank" rel="noopener noreferrer">
                <IconButton>
                  <GitHubIcon />
                </IconButton>
              </a>
              <a href="https://www.linkedin.com/in/cgspeck/" className="IconLink" target="_blank" rel="noopener noreferrer">
                <IconButton>
                  <LinkedInIcon />
                </IconButton>
              </a>
            </Container>
          </Container>
          {this.newCustomHopDialogTags()}
        </div>
      </MuiPickersUtilsProvider>
    );
  }
}

export default App;
