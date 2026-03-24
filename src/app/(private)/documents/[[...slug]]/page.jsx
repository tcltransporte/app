import DocumentView from '@/app/views/documents';
import * as documentService from '@/app/services/document.service';
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

  const initialTableResp = await documentService.findAll({
    slug: typeSlug,
    page: 1,
    limit: 50
  });

  const initialTable = initialTableResp.status === ServiceStatus.SUCCESS 
    ? initialTableResp 
    : { items: [], total: 0 };

  return (
    <DocumentView 
      documentType={documentType}
      initialTable={initialTable}
      initialFilters={{ slug: typeSlug }}
      selectedId={selectedId}
    />
  );
}
