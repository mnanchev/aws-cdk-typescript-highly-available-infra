import { IVpc, SubnetType, Vpc } from "@aws-cdk/aws-ec2";
import { ApplicationLoadBalancer } from "@aws-cdk/aws-elasticloadbalancingv2";
import * as cdk from "@aws-cdk/core";
import { RemovalPolicy } from "@aws-cdk/core";
import { CommonProps } from "../common/common_props";

export interface InterStackCommunication {
}

export class NetworkStack extends cdk.Stack implements InterStackCommunication {
  readonly vpc: IVpc;
  readonly alb: ApplicationLoadBalancer;
  constructor(scope: cdk.Construct, id: string, props: CommonProps) {
    super(scope, id, props);

    function getEnv(stage: string, key: string) {
      return scope.node.tryGetContext(stage).key;
    }
    // =========================================
    //
    //  VPC configurations
    //  Availability zones
    //  subnetConfigurations for private, public and isolated subnets
    //
    // =========================================
    this.vpc = new Vpc(this, `${props.prefix}-vpc`, {
      cidr: props.network.cidr,
      maxAzs: 2,
      subnetConfiguration: [
        {
          subnetType: SubnetType.PUBLIC,
          name: `${props.network.cidr}-Public`,
          cidrMask: 24,
        },
        {
          cidrMask: 24,
          name: `${props.prefix}-Private`,
          subnetType: SubnetType.PRIVATE,
        },
        {
          cidrMask: 28,
          name: `${props.prefix}-Isolated`,
          subnetType: SubnetType.ISOLATED,
        },
      ],
      natGateways: 1,
    });
    // =========================================
    //
    //  Application Load Balancer
    //
    // =========================================
    this.alb = new ApplicationLoadBalancer(this, `${props.prefix}-alb`, {
      vpc: this.vpc,
      internetFacing: props.network.load_balancer.internet_facing,
    });
  }
}
