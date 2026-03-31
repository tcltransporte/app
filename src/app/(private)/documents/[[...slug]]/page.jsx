import DocumentView from '@/app/views/documents';
import * as documentAction from '@/app/actions/document.action';
import { AppContext } from "@/database";
import { ServiceStatus } from '@/libs/service';

export default async function DocumentPage({ params }) {
  const { slug: slugParams } = await params;

  const typeSlug = Array.isArray(slugParams) ? slugParams[0] : slugParams;
  const selectedId = Array.isArray(slugParams) && slugParams.length > 1 ? slugParams[1] : undefined;

  const db = new AppContext();
  let documentType = null;

  if (typeSlug) {
    const docTypeResult = await db.DocumentType.findOne({
      where: { initials: typeSlug.toUpperCase() }
    });
    documentType = docTypeResult ? docTypeResult.get({ plain: true }) : null;
  }

  const documentResult = await documentAction.findAll({
    slug: typeSlug,
    page: 1,
    limit: 50
  });

  if (documentResult.header.status !== ServiceStatus.SUCCESS) {
    throw documentResult
  }

  const initialTable = documentResult.body;

  return (
    <DocumentView
      documentType={documentType}
      initialTable={initialTable}
      initialFilters={{ slug: typeSlug }}
      selectedId={selectedId}
    />
  );
}
