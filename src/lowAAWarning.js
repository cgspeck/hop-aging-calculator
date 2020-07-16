import React from "react";

export default function LowAAWarning(props) {
  if (props.lowAAWarn === true) {
    return (
      <div className="LowAAAlert">
        Less then half of rated alpha acids, you should consider disposing of
        it.
      </div>
    );
  }

  return null;
}
