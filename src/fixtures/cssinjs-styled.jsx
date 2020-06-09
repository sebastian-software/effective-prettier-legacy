import React from "react"
import styled from "styled-components"

const Button = styled.a`
  font: Arial;
  font-size: 12;
  border-radius: 0px;

  &:hover: {
    background: #2200DD
  }
`

export function ToolbarButton() {
  return <Button />
}
