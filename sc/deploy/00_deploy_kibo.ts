import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const kibo = await deploy("Kibo", {
    from: deployer,
    args: [],
    log: true,
  });

  console.log("Kibo deployed to:", kibo.address);
};

export default func;
func.tags = ["Kibo"];
