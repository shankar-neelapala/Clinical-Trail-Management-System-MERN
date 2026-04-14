import React from 'react'

export function DeleteModal({ show, onClose, onConfirm, title, message, testId = 'delete-modal' }) {
  if (!show) return null
  return (
    <div className="modal-overlay" id={testId} data-test={testId}>
      <div className="modal-box sm">
        <div className="modal-head" style={{background:'linear-gradient(135deg,#7f1d1d,#b91c1c)'}}>
          <h5><i className="bi bi-exclamation-triangle-fill"></i> Confirm Delete</h5>
          <button className="modal-close" onClick={onClose}><i className="bi bi-x"></i></button>
        </div>
        <div className="delete-modal-body">
          <div className="delete-icon"><i className="bi bi-trash3-fill"></i></div>
          <h6 style={{fontWeight:700,marginBottom:6}}>{title}</h6>
          <p style={{color:'var(--c-muted)',fontSize:'.85rem',margin:0}} id="deleteWarningMsg">{message}</p>
        </div>
        <div className="modal-foot">
          <button className="btn-ctms btn-outline" id="cancelDeleteBtn" onClick={onClose}>Cancel</button>
          <button className="btn-ctms btn-danger-soft" id="confirmDeleteBtn" name="confirmDeleteBtn" data-test="confirm-delete-btn" onClick={onConfirm}>
            <i className="bi bi-trash3"></i> Delete
          </button>
        </div>
      </div>
    </div>
  )
}

export function Pagination({ pagination, onPage }) {
  if (pagination.pages <= 1) return null
  return (
    <div className="ctms-pagination" id="paginationBar" data-test="pagination-bar">
      <span>Showing {pagination.currentPage} of {pagination.pages} pages &mdash; {pagination.total} records</span>
      <div className="pg-btns">
        <button className="pg-btn" disabled={pagination.currentPage === 1} onClick={() => onPage(pagination.currentPage - 1)}>
          <i className="bi bi-chevron-left"></i>
        </button>
        {[...Array(pagination.pages)].map((_,i) => (
          <button key={i} className={`pg-btn ${pagination.currentPage === i+1 ? 'active' : ''}`} onClick={() => onPage(i+1)}>
            {i+1}
          </button>
        ))}
        <button className="pg-btn" disabled={pagination.currentPage === pagination.pages} onClick={() => onPage(pagination.currentPage + 1)}>
          <i className="bi bi-chevron-right"></i>
        </button>
      </div>
    </div>
  )
}

export function Alert({ alert, onClose }) {
  if (!alert) return null
  return (
    <div className={`ctms-alert ${alert.type === 'success' ? 'alert-success' : 'alert-danger'}`} id="ctmsAlert" data-test="ctms-alert">
      <i className={`bi ${alert.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'}`}></i>
      <span style={{flex:1}}>{alert.message}</span>
      <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'inherit',fontSize:'.9rem'}}>
        <i className="bi bi-x-lg"></i>
      </button>
    </div>
  )
}

export function LoadingRow({ cols }) {
  return (
    <tr><td colSpan={cols} style={{textAlign:'center',padding:'32px 16px'}}>
      <div className="spin spin-dark" style={{width:22,height:22,borderWidth:2,margin:'0 auto 8px'}}></div>
      <div style={{color:'var(--c-muted)',fontSize:'.82rem'}}>Loading data…</div>
    </td></tr>
  )
}

export function EmptyRow({ cols, icon = 'bi-inbox', message = 'No records found' }) {
  return (
    <tr><td colSpan={cols}>
      <div className="empty-state">
        <i className={`bi ${icon}`}></i>
        {message}
      </div>
    </td></tr>
  )
}
