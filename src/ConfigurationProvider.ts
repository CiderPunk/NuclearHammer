import { IConfiguration, IConfigurationProvider } from "./interfaces";

/**
 * retrieve/store configuration
 */

export class ConfigurationProvider implements IConfigurationProvider {

  readonly config: IConfiguration;

  public constructor() {
    this.config = {
      enableShadows: true,
      level: 0
    };

    const confString = localStorage.getItem("config");
    if (confString) {
      const loadedSettings = JSON.parse(confString) as IConfiguration;
      Object.assign(this.config, loadedSettings);
    }
  }


  public setConfig(newSettings: IConfiguration): void {
    Object.assign(this.config, newSettings);
    localStorage.setItem("config", JSON.stringify(this.config));
  }

}
