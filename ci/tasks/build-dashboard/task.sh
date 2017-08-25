#!/bin/bash
set -e

pushd vehicle-fleet-demo/dashboard
    mvn clean install
popd

cp vehicle-fleet-demo/dashboard/target/dashboard-1.0.0.BUILD-SNAPSHOT.jar build-output/

cp vehicle-fleet-demo/manifest.yml build-output/
