
----------------
#refactor in progress

reworking to support new mature typescript ecosystem:
- async/await as default workflow
- modern libraries

if you are interested in trying it out:  ```npm install slib@next``` but ***BE AWARE*** breaking changes can occur in ```@next```


# changelog

- ```v5.x``` - ```fs``` and ```shell``` modules added, everything else removed (rebuilding for ```ts3.x``` and ```await/async```)
  - google libraries are deprecated, bloated, over-specialized, and/or broken on node v10.x.   removed those
  - hapi v18 is a new api, requiring rewriting our helpers.  removed those.
  - KDF moved to ```_to_refactor```.    Plan to re-support those (at least ```argon2```) soon.
  - 

