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
import { DatePicker, TimePicker } from "@material-ui/pickers";

import { DEFAULT_VARIETIES } from "./data";

class App extends Component {
  constructor() {
    super();
    const boilTime = new Date(0, 0, 0, 1);
    this.state = {
      boilTime: boilTime,
      brewDate: new Date(),
      hopRecords: [],
    };
    this.varieties = DEFAULT_VARIETIES;
  }

  onBoilTimeChanged(e) {
    this.setState({ boilTime: e });
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
      calculatedEstimatedAA: 0.0,
      calculatedEstimatedIBU: 0.0,
    };
  }

  newHopRecord() {
    // const { boilTime } = this.state;
    // TODO: convert boil time to minutes and ignore the date part
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
          <TimePicker
            clearable
            ampm={false}
            label="Boil Time"
            // minTime="00:20:00"
            mintime={new Date(0, 0, 0, 8)}
            maxtime={new Date(0, 0, 0, 18, 45)}
            value={this.state.boilTime}
            onChange={this.onBoilTimeChanged.bind(this)}
          />
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

  demoSubstituteRow() {
    return (
      <Grid container spacing={3}>
        <Grid item xs={3}>
          <TextField id="sub-variety" label="Up to (grams)"></TextField>
        </Grid>
        <Grid item xs={3}>
          <TextField id="sub-variety" label="Substitute Variety"></TextField>
        </Grid>
        <Grid item xs={3}>
          <TextField id="sub-tested-aa" label="Rated Alpha Acid"></TextField>
        </Grid>
        <Grid item xs={3}>
          <DatePicker
            id="sub-date"
            label="Rating Date"
            format="dd/MM/yyyy"
            disableFuture
          />
        </Grid>
        <Grid item xs={4}>
          <TextField label="Requried Amount"></TextField>
        </Grid>
        <Grid item xs={4}>
          <TextField label="Estimated Alpha Acid"></TextField>
        </Grid>
        <Grid item xs={4}>
          <TextField label="Estimated IBU"></TextField>
        </Grid>
        <Grid item xs={12}>
          Less then half of rated alpha acids, you should consider disposing of
          it.
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
    console.log(e);
    console.log(e.target.value);
    const value = e.target.value;
    console.log(index);
    var { hopRecords } = this.state;
    hopRecords[index].ibu = value;
    this.setState({ hopRecords });
  }

  substituteTag(substituteRecord, index) {
    return (
      <Grid container spacing={3}>
        <Grid item xs={3}>
          <CancelIcon color="secondary" />
          <TextField id="sub-variety" label="Up to (grams)"></TextField>
        </Grid>
        <Grid item xs={3}>
          <TextField id="sub-variety" label="Substitute Variety"></TextField>
        </Grid>
        <Grid item xs={3}>
          <TextField id="sub-tested-aa" label="Rated Alpha Acid"></TextField>
        </Grid>
        <Grid item xs={3}>
          <DatePicker
            id="sub-date"
            label="Rating Date"
            format="dd/MM/yyyy"
            disableFuture
          />
        </Grid>
        <Grid item xs={4}>
          <TextField label="Requried Amount"></TextField>
        </Grid>
        <Grid item xs={4}>
          <TextField label="Estimated Alpha Acid"></TextField>
        </Grid>
        <Grid item xs={4}>
          <TextField label="Estimated IBU"></TextField>
        </Grid>
        <Grid item xs={12}>
          Less then half of rated alpha acids, you should consider disposing of
          it.
        </Grid>
      </Grid>
    );
  }

  hopRecordTag(hopRecord, index) {
    return (
      <Grid item xs={12}>
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
                <TextField
                  id="variety"
                  label="of Hop Variety"
                  value={hopRecord.variety.name}
                ></TextField>
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
              {hopRecord.substitutions.map((r, i) => this.substituteTag(r, i))}
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
        </div>
      </MuiPickersUtilsProvider>
    );
  }
}

export default App;
