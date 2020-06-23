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

import { DEFAULT_VARIETIES } from "./data";

class App extends Component {
  constructor() {
    super();
    this.state = {
      boilTime: 60,
      brewDate: new Date(),
      hopRecords: [],
      newHopShouldOpen: false,
      newHopName: "",
      newHopHSI: 60.0,
      newHopRecipeIndex: null,
      newHopSubstitutionIndex: null,
    };
    this.varieties = DEFAULT_VARIETIES;
    this.customVarieties = [];
  }

  onBoilTimeChanged(e) {
    const v = parseInt(e.target.value, 10);
    if (!isNaN(v)) {
      this.setState({ boilTime: v });
    }
  }

  onBrewDateChanged(e) {
    this.setState({ brewDate: e });
  }

  newSubstitution(baseVariety) {
    return {
      maxAmount: 0.0,
      variety: baseVariety,
      ratedAlphaAcid: 4.5,
      ratingDate: new Date(),
      calculatedRequiredAmount: 0.0,
      calculatedAge: 0,
      calculatedEstimatedAA: 0.0,
      calculatedEstimatedIBU: 0.0,
    };
  }

  newHopRecord() {
    return {
      ibu: 0.0,
      variety: this.varieties[0],
      additionTime: "60",
      substitutions: [],
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
        <Grid item xs={6}>
          <TextField
            label="Boil Time (minutes)"
            value={this.state.boilTime}
            onChange={this.onBoilTimeChanged.bind(this)}
          ></TextField>
        </Grid>
        <Grid item xs={6}>
          {" "}
          <DatePicker
            id="brew-date"
            label="Brew Date"
            format="dd/MM/yyyy"
            value={this.state.brewDate}
            onChange={this.onBrewDateChanged.bind(this)}
            disablePast
          />
        </Grid>
        <Grid item xs={12}>
          <AddBox color="primary" onClick={this.onAddHopRecord.bind(this)} />
        </Grid>
      </Grid>
    );
  }

  onDeleteHop(index) {
    var { hopRecords } = this.state;
    hopRecords.splice(index, 1);
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

  onIBUChange(index, e) {
    const value = parseFloat(e.target.value);
    if (isNaN(value)) {
      return;
    }
    var { hopRecords } = this.state;
    hopRecords[index].ibu = value;
    this.setState({ hopRecords });
  }

  onSubstituteHopChanged(index, recipeIndex, e) {
    const value = e.target.value;
    var { hopRecords } = this.state;
    var hopRecord = hopRecords[recipeIndex];
    var substituteRecord = hopRecord.substitutions[index];
    substituteRecord.variety = value;
    this.setState({ hopRecords });
  }

  onSubstituteMaxAmountChanged(index, recipeIndex, e) {
    const value = parseFloat(e.target.value);
    if (isNaN(value)) {
      return;
    }
    var { hopRecords } = this.state;
    var hopRecord = hopRecords[recipeIndex];
    var substituteRecord = hopRecord.substitutions[index];
    substituteRecord.maxAmount = value;
    this.setState({ hopRecords });
  }

  onSubstituteRatingAAChanged(index, recipeIndex, e) {
    const value = parseFloat(e.target.value);
    if (isNaN(value)) {
      return;
    }
    var { hopRecords } = this.state;
    var hopRecord = hopRecords[recipeIndex];
    var substituteRecord = hopRecord.substitutions[index];
    substituteRecord.ratedAlphaAcid = value;
    this.setState({ hopRecords });
  }

  onSubstituteRatingDateChanged(index, recipeIndex, e) {
    const value = e;
    var { hopRecords } = this.state;
    var hopRecord = hopRecords[recipeIndex];
    var substituteRecord = hopRecord.substitutions[index];
    substituteRecord.ratingDate = value;
    this.setState({ hopRecords });
    this.calculateSubstitutionValues(index, recipeIndex);
  }

  calculateSubstitutionValues(index, recipeIndex) {
    var { hopRecords } = this.state;
    var hopRecord = hopRecords[recipeIndex];
    var substituteRecord = hopRecord.substitutions[index];
    const brewDate = this.state.brewDate;
    console.log(brewDate);
    console.log(this.state);
    const hopsDate = substituteRecord.ratingDate;
    console.log(hopsDate);
    const interval = Interval.fromDateTimes(hopsDate, brewDate);

    var calculatedRequiredAmount, calculatedAge, calculatedIBU;
    console.log(interval);
    calculatedAge = interval.count("days") - 1;

    if (substituteRecord.maxAmount <= 0) {
      calculatedRequiredAmount = 0;
      calculatedIBU = 0;
    } else {
    }

    substituteRecord.calculatedRequiredAmount = calculatedRequiredAmount;
    substituteRecord.calculatedAge = calculatedAge;
    substituteRecord.calculatedIBU = calculatedIBU;
    console.log(calculatedAge);
    this.setState({ hopRecords });
  }

  substituteTag(substituteRecord, index, recipeIndex) {
    return (
      <Grid container spacing={3} key={`${recipeIndex}_${index}`}>
        <Grid item xs={3}>
          <TextField
            label="Up to (grams)"
            value={substituteRecord.maxAmount}
            onChange={this.onSubstituteMaxAmountChanged.bind(
              this,
              index,
              recipeIndex
            )}
          ></TextField>
        </Grid>
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
        <Grid item xs={3}>
          <TextField
            label="Rated Alpha Acid"
            value={substituteRecord.ratedAlphaAcid}
            onChange={this.onSubstituteRatingAAChanged.bind(
              this,
              index,
              recipeIndex
            )}
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
        <Grid item xs={3}>
          <TextField
            label="Required Amount"
            value={substituteRecord.calculatedRequiredAmount}
          ></TextField>
        </Grid>
        <Grid item xs={3}>
          <TextField
            label="Age at Brew date (days)"
            value={substituteRecord.calculatedAge}
          ></TextField>
        </Grid>
        <Grid item xs={3}>
          <TextField label="Estimated Alpha Acid"></TextField>
        </Grid>
        <Grid item xs={3}>
          <TextField
            label="Estimated IBU"
            value={substituteRecord.calculatedIBU}
          ></TextField>
        </Grid>
        <Grid item xs={1}>
          <CancelIcon />
        </Grid>
        <Grid item xs={11}>
          Less then half of rated alpha acids, you should consider disposing of
          it.
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

  hopRecordTag(hopRecord, index) {
    return (
      <Grid item xs={12} key={index}>
        <Card variant="outlined">
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                Recipe Amount:
              </Grid>
              <Grid item xs={12}>
                <TextField
                  id="ibu"
                  label="IBUs"
                  value={hopRecord.ibu}
                  onChange={this.onIBUChange.bind(this, index)}
                ></TextField>
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
                <TextField
                  id="atminutes"
                  label="at Minutes"
                  value={hopRecord.additionTime}
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
            <FileCopyIcon color="primary" />
            <DeleteIcon
              color="secondary"
              onClick={this.onDeleteHop.bind(this, index)}
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
            Hop Aging Calculator
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
