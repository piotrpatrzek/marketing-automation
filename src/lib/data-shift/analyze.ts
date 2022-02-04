import { DataSet } from "../data/set";
import { ConsoleLogger } from "../log/console";
import { License } from "../model/license";

export class DataShiftAnalyzer {

  lastLicenseMap!: LicenseMap;

  private console;
  public constructor() {
    this.console = new LabeledConsoleLogger('Analyze Data Shift');
  }

  public run([firstDataset, ...dataSets]: DataSet[]) {
    this.prepareInitialLicenses(firstDataset);
    this.analyzeLicensesInDataSets(dataSets);
  }

  analyzeLicensesInDataSets(dataSets: DataSet[]) {
    this.console.printInfo(`Analyzing license data shift`);

    for (const ds of dataSets) {

      const currentLicenseMap = new LicenseMap(ds.mpac.licenses);

      for (const license of this.lastLicenseMap.values()) {
        const found = currentLicenseMap.get(license);
        if (!found) {
          this.console.printWarning('License went missing:', {
            timestampChecked: ds.timestamp.toISO(),
            license: license.id,
          });
        }
      }

      this.lastLicenseMap = currentLicenseMap;

    }

    this.console.printInfo(`Done.`);
  }

  prepareInitialLicenses(firstDataset: DataSet) {
    this.console.printInfo(`Preparing initial licenses`);
    this.lastLicenseMap = new LicenseMap(firstDataset.mpac.licenses);
    this.console.printInfo(`Done.`);
  }

}

class LabeledConsoleLogger {

  console;
  constructor(private label: string) {
    this.console = new ConsoleLogger();
  }

  printInfo(...args: any[]) { this.console.printInfo(this.label, ...args); }
  printWarning(...args: any[]) { this.console.printWarning(this.label, ...args); }
  printError(...args: any[]) { this.console.printError(this.label, ...args); }

}

class LicenseMap {

  #map;
  constructor(licenses: License[]) {
    this.#map = new Map<string, License>();
    for (const license of licenses) {
      this.add(license);
    }
  }

  get(record: License): License | undefined {
    return (
      this.maybeGet(record.data.addonLicenseId) ??
      this.maybeGet(record.data.appEntitlementId) ??
      this.maybeGet(record.data.appEntitlementNumber)
    );
  }

  values() {
    return this.#map.values();
  }

  maybeGet(id: string | null): License | undefined {
    if (id) return this.#map.get(id);
    return undefined;
  }

  add(record: License) {
    if (record.data.addonLicenseId) this.#map.set(record.data.addonLicenseId, record);
    if (record.data.appEntitlementId) this.#map.set(record.data.appEntitlementId, record);
    if (record.data.appEntitlementNumber) this.#map.set(record.data.appEntitlementNumber, record);
  }

}
