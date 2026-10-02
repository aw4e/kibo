import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

// Set TOKEN_ADDRESS in .env to use an existing token; otherwise a MockERC20 is deployed.
const MOCK_ALLOWED = ["bnbTestnet", "hardhat", "localhost"];

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts, network } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  let token = process.env.TOKEN_ADDRESS;

  if (!token) {
    if (!MOCK_ALLOWED.includes(network.name)) {
      throw new Error(`No token for network "${network.name}". Set TOKEN_ADDRESS in .env.`);
    }
    const mock = await deploy("MockERC20", { from: deployer, args: [], log: true });
    token = mock.address;
    console.log(`MockERC20 (test token) deployed to: ${token} - mint(to, amount) is open`);
  }

  const kibo = await deploy("Kibo", {
    from: deployer,
    args: [token],
    log: true,
  });

  console.log(`Kibo deployed to: ${kibo.address} (${network.name}, token ${token})`);
};

export default func;
func.tags = ["Kibo"];
