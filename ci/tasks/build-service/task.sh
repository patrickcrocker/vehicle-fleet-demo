#!/bin/bash
set -e

pushd vehicle-fleet-demo
    ./mvnw clean install -Dmaven.repo.local=$PWD/.m2repository
popd

cp vehicle-fleet-demo/fleet-location-service/target/fleet-location-service-1.0.0.BUILD-SNAPSHOT.jar build-output/
cp vehicle-fleet-demo/fleet-location-simulator/target/fleet-location-simulator-1.0.0.BUILD-SNAPSHOT.jar build-output/
cp vehicle-fleet-demo/fleet-location-ingest/target/fleet-location-ingest-1.0.0.BUILD-SNAPSHOT.jar build-output/
cp vehicle-fleet-demo/fleet-location-updater/target/fleet-location-updater-1.0.0.BUILD-SNAPSHOT.jar build-output/
cp vehicle-fleet-demo/service-location-service/target/service-location-service-1.0.0.BUILD-SNAPSHOT.jar build-output/
cp vehicle-fleet-demo/dashboard/target/dashboard-1.0.0.BUILD-SNAPSHOT.jar build-output/

cp vehicle-fleet-demo/manifest.yml build-output/
