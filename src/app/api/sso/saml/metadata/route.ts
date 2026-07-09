/**
 * SAML SP Metadata
 * GET /api/sso/saml/metadata
 * Returns SP metadata XML for IdP configuration.
 */

import { NextResponse } from "next/server";

const SP_ENTITY_ID = process.env.SAML_SP_ENTITY_ID || "https://artha.ai/saml";
const SP_ACS_URL = process.env.SAML_SP_ACS_URL || "https://artha.ai/api/sso/saml/acs";
const SP_SLS_URL = process.env.SAML_SP_SLS_URL || "https://artha.ai/api/sso/saml/sls";

export async function GET() {
  const metadata = `<?xml version="1.0" encoding="UTF-8"?>
<EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata"
                  entityID="${SP_ENTITY_ID}">
  <SPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</NameIDFormat>
    <AssertionConsumerService index="0"
                              isDefault="true"
                              Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
                              Location="${SP_ACS_URL}"/>
    <SingleLogoutService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect"
                         Location="${SP_SLS_URL}"/>
  </SPSSODescriptor>
</EntityDescriptor>`;

  return new NextResponse(metadata, {
    headers: { "Content-Type": "application/xml" },
  });
}
