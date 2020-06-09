import jss from 'jss'

const styles = {
  button: {
    fontFamily: "Arial",
    fontSize: 12,
    '&:hover': {
      background: 'blue'
    }
  }
}

const { classes } = jss.createStyleSheet(styles).attach()
