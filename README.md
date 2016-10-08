
----------------
# Abstract
**```slib```** contains server-specific (*NodeJs*) functionality that complements the ```xlib``` npm library.

Tested on ubuntu 12.x and Windows 10.

## Functionality

*this section will probabbly be removed when API documentation generation is working.*

The main functional areas ```slib``` covers:

- WebServer (Hapi and hapi specific helpers)
- Security (KDF)
- File (Promise based ```fs``` library)

----------------
# Installation

#### Prerequisites
- must have ```node-gyp``` installed globally.  


## Pains in the ass


#### problems running ```npm install```?

- [```node-gyp```](https://github.com/nodejs/node-gyp) can have problems compiling sometimes.  make sure you follow it's install instructions (which are ***finally*** fairly clear/simple) 
  - if you still get compile errors, you might need to upgrade npm too:  either ```npm install -g npm``` or ```npm install -g npm@next```



