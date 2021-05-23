#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "@aws-cdk/core";
import { NetworkStack } from "../lib/network/network";
import { CommonProps } from "../lib/common/common_props";
import { ComputeStack } from "../lib/compute/compute";
import { StorageStack } from "../lib/storage/storage";

const app = new cdk.App();
let devConfigurations = app.node.tryGetContext("dev");
let devProperties: CommonProps = {
  prefix: devConfigurations.prefix,
  region: devConfigurations.region,
  network: {
    cidr: devConfigurations.network.cidr,
    load_balancer: {
      internet_facing: devConfigurations.network.load_balancer.internet_facing,
      port: devConfigurations.network.load_balancer.port,
    },
  },
  compute: {
    instanceType: devConfigurations.compute.instanceType,
    image: devConfigurations.compute.image,
    minCapacity: devConfigurations.compute.minCapacity,
    maxCapacity: devConfigurations.compute.maxCapacity,
  },
  storage: {
    database: {
      instanceType: devConfigurations.storage.database.instanceType,
    },
  },
};
const network = new NetworkStack(
  app,
  `${devProperties.prefix}-networkStack`,
  devProperties
);
const vpc = network.vpc;
const alb = network.alb;
const compute = new ComputeStack(
  app,
  `${devProperties.prefix}-computeStack`,
  devProperties,
  { vpc, alb }
);
const instances = compute.autoscaling;
const storage = new StorageStack(
  app,
  `${devProperties.prefix}-storageStack`,
  devProperties,
  { vpc, instances }
);
