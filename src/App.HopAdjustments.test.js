import React, { Component } from "react";

import { render, cleanup, fireEvent } from "@testing-library/react";
import App from "./App";

import { Settings } from "luxon";

beforeAll(() => {
  // !!! YYYY, MM, DD, but for inexplicable reasons MM is 0 indexed!
  // brewing on NYE like a boss!
  Settings.now = () => new Date(2020, 11, 31).valueOf();
});

afterEach(cleanup);

test("renders 'Hop Addition 1' when it starts", () => {
  const app = render(<App />);
  expect(app).toMatchSnapshot();
});

test("renders two hop additions when the new button is pressed", () => {
  const app = render(<App />);
  const button = app.getByRole("button", { name: "New Hop Addition" });
  fireEvent(
    button,
    new MouseEvent("click", { bubbles: true, cancelable: true })
  );
  expect(app).toMatchSnapshot();
});

test("renders a clone of hop addition 1 when the Copy button is pressed", () => {
  const app = render(<App />);
  const button = app.getByRole("button", { name: "Copy" });
  fireEvent(
    button,
    new MouseEvent("click", { bubbles: true, cancelable: true })
  );
  expect(app).toMatchSnapshot();
});

test("deleting the clone brings us back to 1 hop addition", () => {
  const app = render(<App />);
  const button = app.getByRole("button", { name: "Copy" });
  fireEvent(
    button,
    new MouseEvent("click", { bubbles: true, cancelable: true })
  );
  app.findAllByRole("button", { name: "Delete" }).then((deleteButtons) => {
    const lastDeleteButton = deleteButtons[deleteButtons.length - 1];
    fireEvent(
      lastDeleteButton,
      new MouseEvent("click", { bubbles: true, cancelable: true })
    );
    expect(app).toMatchSnapshot();
  });
});

test("deleting the 1 hop addition brings us to no hop additions", () => {
  const app = render(<App />);
  const button = app.getByRole("button", { name: "Delete" });
  fireEvent(
    button,
    new MouseEvent("click", { bubbles: true, cancelable: true })
  );
  expect(app).toMatchSnapshot();
});
