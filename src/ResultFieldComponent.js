import React from "react";

export default function ResultField(props) {
  return (
    <div>
      {props.label}: <br />
      <div style={{ color: "#3366cc" }}>
        {props.value} {props.postValue}
      </div>
    </div>
  );
}
