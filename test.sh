#! /bin/bash -e
CI=true yarn test
yarn run cypress run
