<template>
  <button class="ui button toggle mybtn" :class="[btnColour, 'mybtn']"></button>
</template>
<script>
export default {
  name: 'LedComponent',
  props: {
    id: { type: String, default: '' },
    onColour: { type: String, default: 'green' },
    offColour: { type: String, default: 'white' },
    errColour: { type: String, default: 'amber' },
    ledValue: { type: Boolean, default: false },
    isSolidLed: { type: Boolean, default: false },
    isServiceLed: { type: Boolean, default: false },
    issysAttentionLed: { type: Boolean, default: false },
    issysidentifyLed: { type: Boolean, default: false },
    health: { type: String, default: '' },
  },
  data() {
    return {
      checkbox: false,
      blinkcolour: false,
      btnColour: 'white',
      intervalId: 0,
      onColours: this.onColour,
      offColours: this.offColour,
      errColours: 'red',
      cid: this.id,
    };
  },
  mounted() {
    if (this.isServiceLed && this.isSolidLed) {
      clearInterval(this.intervalId);
      if (this.ledValue === `global.status.on`) {
        this.turnon();
      } else {
        this.startBlinking();
      }
    } else if (this.isServiceLed) {
      if (this.isServiceLed && this.issysidentifyLed) {
        this.issysidentifyLed ? this.turnon() : this.turnoff();
      } else if (this.isServiceLed && this.issysAttentionLed) {
        this.issysAttentionLed ? this.turnon() : this.turnoff();
      }
    } else {
      if (!(this.health === 'Critical')) {
        if (this.ledValue) {
          this.startBlinking();
        } else {
          this.stopBlinking();
        }
      } else {
        this.turnon();
      }
    }
  },
  methods: {
    myFunction() {
      if (this.blinkcolour) {
        this.turnoff();
      } else {
        this.turnon();
      }
    },
    turnoff() {
      this.blinkcolour = false;
      this.btnColour = this.offColour;
    },
    turnon() {
      this.blinkcolour = true;
      this.btnColour = this.onColour;
    },

    toggleCheckbox() {
      this.checkbox = true;
      if (this.blinkcolour) {
        this.turnoff();
        this.blinkcolour = false;
      } else {
        this.turnon();
        this.blinkcolour = true;
      }
      this.intervalId = setInterval(this.myFunction, 500);
    },

    turnErrorColor() {
      if (this.checkbox) {
        this.stopBlinking();
      }
      this.blinkcolour = true;
      this.btnColour = this.errColours;
    },

    stopBlinking() {
      clearInterval(this.intervalId);
      this.turnoff();
      this.checkbox = false;
    },
    startBlinking() {
      if (!this.checkbox) this.toggleCheckbox();
    },
  },
};
</script>

<style scoped>
.mybtn {
  border-radius: 50%;
  padding: 12px;
  border-color: black;
  color: black;
  outline-color: black;
}

.green {
  background-color: green;
}
.blue {
  background-color: #0029e0;
}
.amber {
  background-color: #ffb300;
}
.red {
  background-color: red;
}
.white {
  background-color: white;
}
.lightgrey {
  background-color: lightgrey;
}
</style>
