import { StackProps } from "@aws-cdk/core";

export interface CommonProps extends StackProps {
  readonly prefix: string;
  readonly region: string;
  readonly network: {
    cidr: string;
    load_balancer: {
      internet_facing: boolean;
      port: number;
    };
  };
  readonly compute: {
    instanceType: string;
    image: string;
    minCapacity: number;
    maxCapacity: number;
  };
  readonly storage: {
    database: {
      instanceType: string;
    };
  };
}
