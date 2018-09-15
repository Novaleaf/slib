import xlib = require("xlib");

/** google cloud api's */
export import gcloud = require("./gcloud");


/** email service: npm sendgrid. */
export import sendGrid = require("sendgrid");


/** payment processing */
export var stripe: xlib.definitions.stripe.StripeStatic = require("stripe");