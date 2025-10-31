import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployedFHESignIn = await deploy("FHESignIn", {
    from: deployer,
    log: true,
  });

  console.log(`FHESignIn contract: `, deployedFHESignIn.address);
};
export default func;
func.id = "deploy_fheSignIn"; // id required to prevent reexecution
func.tags = ["FHESignIn"];


