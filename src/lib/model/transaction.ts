import assert from "assert";
import { Contact } from "./contact";
import { AddonLicenseId, ContactInfo, getContactInfo, getPartnerInfo, maybeGetContactInfo, PartnerInfo } from "./marketplace/common";
import { RawTransaction } from "./marketplace/raw";

export interface TransactionData {
  addonLicenseId: AddonLicenseId,
  licenseId: string,
  addonKey: string,
  addonName: string,
  lastUpdated: string,

  technicalContact: ContactInfo,
  billingContact: ContactInfo | null,
  partnerDetails: PartnerInfo | null,

  company: string,
  country: string,
  region: string,

  tier: string,
  licenseType: 'COMMERCIAL' | 'ACADEMIC' | 'COMMUNITY',
  hosting: 'Server' | 'Cloud' | 'Data Center',
  maintenanceStartDate: string,
  maintenanceEndDate: string,

  transactionId: string,
  saleDate: string,
  saleType: 'Renewal' | 'Upgrade' | 'New' | 'Refund',

  billingPeriod: string,

  purchasePrice: number,
  vendorAmount: number,
}

export class Transaction {

  /** Unique ID for this Transaction. */
  public id: string;
  public tier: number;

  public techContact!: Contact;
  public billingContact: Contact | null = null;
  public partnerContact: Contact | null = null;

  public refunded = false;

  static fromRaw(rawTransaction: RawTransaction) {
    return new Transaction({
      transactionId: rawTransaction.transactionId,

      addonLicenseId: rawTransaction.addonLicenseId,
      licenseId: rawTransaction.licenseId,
      addonKey: rawTransaction.addonKey,
      addonName: rawTransaction.addonName,
      lastUpdated: rawTransaction.lastUpdated,

      technicalContact: getContactInfo(rawTransaction.customerDetails.technicalContact),
      billingContact: maybeGetContactInfo(rawTransaction.customerDetails.billingContact),
      partnerDetails: getPartnerInfo(rawTransaction.partnerDetails),

      company: rawTransaction.customerDetails.company,
      country: rawTransaction.customerDetails.country,
      region: rawTransaction.customerDetails.region,

      tier: rawTransaction.purchaseDetails.tier,
      licenseType: rawTransaction.purchaseDetails.licenseType,
      hosting: rawTransaction.purchaseDetails.hosting,
      maintenanceStartDate: rawTransaction.purchaseDetails.maintenanceStartDate,
      maintenanceEndDate: rawTransaction.purchaseDetails.maintenanceEndDate,

      saleDate: rawTransaction.purchaseDetails.saleDate,
      saleType: rawTransaction.purchaseDetails.saleType,
      billingPeriod: rawTransaction.purchaseDetails.billingPeriod,
      purchasePrice: rawTransaction.purchaseDetails.purchasePrice,
      vendorAmount: rawTransaction.purchaseDetails.vendorAmount,
    });
  }

  public constructor(public data: TransactionData) {
    this.id = uniqueTransactionId(this.data);
    this.tier = this.parseTier();
  }

  private parseTier() {
    const tier = this.data.tier;

    if (tier === 'Unlimited Users') return 10001;

    let m;
    if (m = tier.match(/^Per Unit Pricing \((\d+) users\)$/i)) {
      return +m[1];
    }
    if (m = tier.match(/^(\d+) Users$/)) {
      return +m[1];
    }

    assert.fail(`Unknown transaction tier: ${tier}`);
  }

}

export function uniqueTransactionId(data: { transactionId: string, addonLicenseId: string }) {
  return `${data.transactionId}[${data.addonLicenseId}]`
}
