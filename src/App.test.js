import React from "react";
import { render } from "@testing-library/react";
import App from "./App";

test("renders Hop Aging Calculator heading", () => {
  const { getByText } = render(<App />);
  const headingElement = getByText(/Hop Aging Calculator/i);
  expect(headingElement).toBeInTheDocument();
});
