webc
====

Webc merges the coding pad of CodeMirror with a back-end connected to emscripten, allowing you to code in C++ right in the browser and getting the JS result to check the output.

The compilation is done server-side so be careful with the load.

Installation
============

You need to have emscripten installed in your server, and check the version, it only works with the 1.16.0 compiled from the repository.

Make sure your http server (apache or nginx) has rights to call the emcc compiler.

This script do not clean the tmp folder ever, so after some use you will have severeal MBs in this folder, be away of that.




Javi Agenjo (@tamat) 
