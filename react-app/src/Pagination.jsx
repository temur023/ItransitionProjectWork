import React from "react";
import { useTranslation } from "react-i18next";

export default function Pagination({ currentPage, totalPages, onPageChange }) {
    const { t } = useTranslation();

    if (totalPages <= 1) return null;

    return (
        <nav>
            <ul className="pagination d-flex justify-content-center mt-3">
                <li className={`page-item ${currentPage <= 1 ? 'disabled' : ''}`}>
                    <button className="page-link"
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage <= 1}>
                        {t('previous')}
                    </button>
                </li>
                {[...Array(totalPages)].map((_, index) => {
                    const pageNum = index + 1;
                    return (
                        <li key={pageNum} className={`page-item ${currentPage === pageNum ? 'active' : ''}`}>
                            <button className="page-link"
                                onClick={() => onPageChange(pageNum)}>
                                {pageNum}
                            </button>
                        </li>
                    );
                })}
                <li className={`page-item ${currentPage >= totalPages ? 'disabled' : ''}`}>
                    <button className="page-link"
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage >= totalPages}>
                        {t('next')}
                    </button>
                </li>
            </ul>
        </nav>
    );
}
