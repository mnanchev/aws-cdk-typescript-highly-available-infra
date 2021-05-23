#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { SimpleInfraStack } from '../lib/simple_infra-stack';

const app = new cdk.App();
new SimpleInfraStack(app, 'SimpleInfraStack');
