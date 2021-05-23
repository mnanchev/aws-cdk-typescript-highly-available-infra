import { AutoScalingGroup } from "@aws-cdk/aws-autoscaling";
import {
  InstanceClass,
  InstanceSize,
  InstanceType,
  IVpc,
  SubnetType,
} from "@aws-cdk/aws-ec2";
import { LifecyclePolicy, PerformanceMode, FileSystem } from "@aws-cdk/aws-efs";
import {
  AuroraMysqlEngineVersion,
  Credentials,
  DatabaseCluster,
  DatabaseClusterEngine,
} from "@aws-cdk/aws-rds";
import { Construct, Stack } from "@aws-cdk/core";
import { CommonProps } from "../common/common_props";

export class StorageStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    props: CommonProps,
    compute: { vpc: IVpc; instances: AutoScalingGroup }
  ) {
    super(scope, id, props);
    let instanceFamily = props.storage.database.instanceType.split(".")[0];
    let instanceSize = props.storage.database.instanceType.split(".")[1];
    let computeVPC = compute.vpc;
    let computeInstances = compute.instances;
    // =========================================
    //
    //  AURORA
    //
    // =========================================
    const cluster = new DatabaseCluster(
      this,
      `${props.prefix}-aurora-cluster-`,
      {
        engine: DatabaseClusterEngine.auroraMysql({
          version: AuroraMysqlEngineVersion.VER_2_08_1,
        }),
        instanceProps: {
          instanceType: InstanceType.of(
            Object.values(InstanceClass).filter(
              (value) => value === instanceFamily
            )[0],
            Object.values(InstanceSize).filter(
              (value) => value === instanceSize
            )[0]
          ),
          vpcSubnets: {
            subnetType: SubnetType.ISOLATED,
          },
          vpc: computeVPC,
        },
      }
    );
    cluster.connections.allowDefaultPortFrom(computeInstances);
    // =========================================
    //
    //  EFS
    //
    // =========================================
    const fileSystem = new FileSystem(this, `${props.prefix}-efs`, {
      vpc: computeVPC,
      lifecyclePolicy: LifecyclePolicy.AFTER_14_DAYS,
      performanceMode: PerformanceMode.GENERAL_PURPOSE,
    });
    fileSystem.connections.allowDefaultPortFrom(computeInstances);
  }
}
