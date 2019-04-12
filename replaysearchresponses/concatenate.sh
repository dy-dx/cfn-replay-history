#!/bin/bash

for x in `ls replaysearchresponses/2019-04-11/* | sort -V`; do cat "$x" >> concatenated && echo "" >> concatenated; done
