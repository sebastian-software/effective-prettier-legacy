import React from "react"
import { createUseStyles } from "react-jss"

const useStyles = createUseStyles({
  button: {
    font: "Arial",
    fontSize: 12,
    borderRadius: '0px',
    '&:hover': {
      background: '#2200DD'
    }
  }
})

const { classes } = jss.createStyleSheet(styles).attach()

export function ToolbarButton() {
  const classes = useStyles()
  return <Button className={classes.button} />
}
