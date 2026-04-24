import { useEffect, useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import "./MyOrders.css";

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("all");
  const [cancellingId, setCancellingId] = useState(null);
  const navigate = useNavigate();

  // Backend Arabic status → frontend CSS class key
  const statusMap = {
    "قيد الانتظار": "processing",
    "قيد التجهيز" : "processing",
    "في الطريق":  "shipping",
    "تم التسليم":   "delivered",
    "ملغي":         "cancelled",
  };

  // CSS class per status key
  const statusClass = {
    processing: "",           // default gold style from CSS
    shipping:   "shipping",
    delivered:  "delivered",
    cancelled:  "order-cancelled",
  };

  // Dot class per status key
  const dotClass = {
    processing: "",
    shipping:   "shipping",
    delivered:  "complete",
    cancelled:  "cancelled",
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axios.get("http://localhost:8080/order/history", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        });
        setOrders(res.data.data || []);
      } catch (err) {
        console.error(err);
        if (err.response?.status === 401) navigate("/login");
      }
    };
    fetchOrders();
  }, [navigate]);

  const filteredOrders =
    filter === "all"
      ? orders
      : orders.filter((o) => statusMap[o.status] === filter);

  async function cancelOrder(orderId) {
    if (!window.confirm("هل أنتِ متأكدة من إلغاء الطلب؟")) return;
    setCancellingId(orderId);
    try {
      await axios.delete(`http://localhost:8080/order/${orderId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, status: "ملغي" } : o))
      );
    } catch (err) {
      alert(err.response?.data?.message || "فشل إلغاء الطلب");
    } finally {
      setCancellingId(null);
    }
  }

  async function reorder(order) {
    try {
      for (const store of order.products) {
        for (const item of store.products) {
          await axios.post(
            "http://localhost:8080/cart/product",
            {
              product_id: item.prod_id?._id || item.prod_id,
              quantity: item.quantity,
            },
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
              },
            }
          );
        }
      }
      alert("✅ تمت إضافة المنتجات إلى السلة!");
    } catch {
      alert("فشل إعادة الطلب");
    }
  }

  const FILTERS = [
    { label: "الكل",        value: "all" },
    { label: "قيد التجهيز", value: "processing" },
    { label: "في الطريق",   value: "shipping" },
    { label: "تم التسليم",  value: "delivered" },
    { label: "ملغى",        value: "cancelled" },
  ];

  return (
    <>
      {/* ── HEADER ── */}
      <div className="Page-Header">
        <h1>📦 طلباتي</h1>
        <p>تابعي حالة طلباتك السابقة والحالية بكل سهولة وتفاصيل دقيقة</p>
      </div>

      {/* ── FILTER BUTTONS ── */}
      <div className="State-Buttons">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`State-btn${filter === f.value ? " active" : ""}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── ORDERS ── */}
      {filteredOrders.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">🛍️</span>
          <p>لا يوجد طلبات في هذه الفئة</p>
        </div>
      ) : (
        filteredOrders.map((order) => {
          const key       = statusMap[order.status] || "processing";
          const isPending   = key === "processing";
          const isCancelled = key === "cancelled";

          return (
            <div className="Orders-Container" key={order._id}>

              {/* HEADER */}
              <div className="Order-Header">
                <div className="order-info">
                  <div className="order-id">
                    #GQ-{order._id.slice(-4).toUpperCase()}
                  </div>
                  <div className="order-date">
                    {new Date(order.createdAt).toLocaleString("ar-EG")}
                  </div>
                </div>
                <div className={`order-status ${statusClass[key]}`}>
                  <span className={`little-cycle ${dotClass[key]}`}></span>
                  {order.status}
                </div>
              </div>

              {/* ITEMS */}
              <div className="Order-Items">
                {order.products?.map((store, i) =>
                  store.products?.map((item, j) => (
                    <div className="Order-Item" key={`${i}-${j}`}>
                      <div className="item-image">
                        <img
                          loading="lazy"
                          src={`http://localhost:8080/${item.prod_id?.images?.[0]}`}
                          alt={item.name}
                          onError={(e) => {
                            e.target.style.display = "none";
                            e.target.parentElement.innerHTML =
                              "<span class='img-fallback'>🧴</span>";
                          }}
                        />
                      </div>
                      <div className="item-info">
                        <div className="item-name">{item.name}</div>
                        <div className="item-brand">
                          من: {store.owner_store_id?.store_name}
                        </div>
                        <div className="price-quantity">
                          <div className="item-quantity">
                            الكمية: {item.quantity}
                          </div>
                          <div className="item-price">{item.price} ج.م</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* FOOTER */}
              <div className="Order-Footer">
                <div className="total-container">
                  <div className="total-label">إجمالي الطلب</div>
                  <div className="total-price">
                    {order.total_price?.toLocaleString("ar-EG")} ج.م
                  </div>
                </div>

                <div className="foot-btns">
                  {isCancelled && (
                    <button
                      className="State-btn repeat-btn"
                      onClick={() => reorder(order)}
                    >
                      إعادة طلب
                    </button>
                  )}

                  <Link
                    to={`/orders/${order._id}`}
                    className="details-btn"
                  >
                    التفاصيل
                  </Link>

                  {isPending && (
                    <button
                      className="State-btn cancel-btn"
                      onClick={() => cancelOrder(order._id)}
                      disabled={cancellingId === order._id}
                    >
                      {cancellingId === order._id ? "جاري الإلغاء..." : "إلغاء الطلب"}
                    </button>
                  )}
                </div>
              </div>

            </div>
          );
        })
      )}
    </>
  );
}
