import { AutoScalingGroup, GroupMetrics } from "@aws-cdk/aws-autoscaling";
import {
  InstanceClass,
  InstanceSize,
  InstanceType,
  IVpc,
  MachineImage,
  Port,
  SubnetType,
} from "@aws-cdk/aws-ec2";
import { ApplicationLoadBalancer } from "@aws-cdk/aws-elasticloadbalancingv2";
import { ManagedPolicy, Role, ServicePrincipal } from "@aws-cdk/aws-iam";
import { Construct, Stack } from "@aws-cdk/core";
import { CommonProps } from "../common/common_props";
import { InterStackCommunication } from "../network/network";

export interface EC2InterStackCommunication extends InterStackCommunication {
  autoscaling: AutoScalingGroup;
}

export class ComputeStack extends Stack implements EC2InterStackCommunication {
  readonly autoscaling: AutoScalingGroup;
  readonly vpc: IVpc;
  readonly alb: ApplicationLoadBalancer;

  constructor(
      scope: Construct,
      id: string,
      props: CommonProps,
      network: { vpc: IVpc; alb: ApplicationLoadBalancer }
  ) {
    super(scope, id, props);
    this.vpc = network.vpc;
    this.alb = network.alb;
    // =========================================
    //
    //  Autoscaling instance profile
    //
    // =========================================
    const role = new Role(this, `${props.prefix}-ec2-role`, {
      assumedBy: new ServicePrincipal("ec2.amazonaws.com"),
    });
    role.addManagedPolicy(
        ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore")
    );
    let region = props.region;
    let image = props.compute.image;
    let instanceFamily = props.compute.instanceType.split(".")[0];
    let instanceSize = props.compute.instanceType.split(".")[1];
    // =========================================
    //
    //  Autoscaling
    //
    // =========================================
    this.autoscaling = new AutoScalingGroup(this, `${props.prefix}-asg`, {
      instanceType: InstanceType.of(
          Object.values(InstanceClass).filter(
              (value) => value === instanceFamily
          )[0],
          Object.values(InstanceSize).filter((value) => value === instanceSize)[0]
      ),
      groupMetrics: [GroupMetrics.all()],
      machineImage: MachineImage.genericLinux({
        region: image,
      }),
      minCapacity: props.compute.minCapacity,
      maxCapacity: props.compute.maxCapacity,
      vpc: network.vpc,
      role: role,
      vpcSubnets: {
        subnetType: SubnetType.PRIVATE,
      },
    });

    // =========================================
    //
    //  Listener
    //
    // =========================================
    const listener = network.alb.addListener(`${props.region}-alb-listener`, {
      port: 80,
    });
    // =========================================
    //
    //  Target
    //
    // =========================================
    listener.addTargets(`${props.prefix}-targets`, {
      port: 80,
      targets: [this.autoscaling],
    });
    listener.connections.allowDefaultPortFromAnyIpv4(
        "Open access from internet"
    );
  }
}