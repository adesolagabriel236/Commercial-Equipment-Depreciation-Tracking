;; Asset Registration Contract
;; Records details of business equipment

(define-data-var last-asset-id uint u0)

(define-map assets
  { asset-id: uint }
  {
    name: (string-ascii 100),
    serial-number: (string-ascii 50),
    manufacturer: (string-ascii 100),
    purchase-date: uint,
    owner: principal,
    category: (string-ascii 50),
    status: (string-ascii 20)
  }
)

(define-public (register-asset
    (name (string-ascii 100))
    (serial-number (string-ascii 50))
    (manufacturer (string-ascii 100))
    (purchase-date uint)
    (category (string-ascii 50)))
  (let ((new-id (+ (var-get last-asset-id) u1)))
    (begin
      (var-set last-asset-id new-id)
      (map-set assets
        { asset-id: new-id }
        {
          name: name,
          serial-number: serial-number,
          manufacturer: manufacturer,
          purchase-date: purchase-date,
          owner: tx-sender,
          category: category,
          status: "active"
        }
      )
      (ok new-id)
    )
  )
)

(define-public (update-asset-status (asset-id uint) (new-status (string-ascii 20)))
  (let ((asset (unwrap! (map-get? assets { asset-id: asset-id }) (err u404))))
    (if (is-eq tx-sender (get owner asset))
      (begin
        (map-set assets
          { asset-id: asset-id }
          (merge asset { status: new-status })
        )
        (ok true)
      )
      (err u403)
    )
  )
)

(define-read-only (get-asset (asset-id uint))
  (map-get? assets { asset-id: asset-id })
)

(define-read-only (get-asset-count)
  (var-get last-asset-id)
)
