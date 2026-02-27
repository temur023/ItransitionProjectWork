import React, {useState,useEffect,useCallback,} from "react";
import axios from 'axios';
import { Link, useNavigate,  useParams } from "react-router-dom";

function InventoryPage(){
    const [items, setItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [filter, setFilter] = useState({ pageNumber: 1, pageSize: 10 });
    const [message, setMessage] = useState({ text: "", type: "" });
    const { inventoryId } = useParams();
    const api_url = "http://localhost:5137";
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        customId: "",
        name: "",
        description: "",
        createdAt: "",
        updatedAt: ""
    });
    const totalPages = Math.ceil(total / filter.pageSize);

    const fetchItems = useCallback(async () => {
        try {
            const token = localStorage.getItem("userToken");
            const endpoint = "/api/Item/get-all";
            const response = await axios.get(`${api_url}${endpoint}`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { PageNumber: filter.pageNumber, PageSize: filter.pageSize, InventoryId:inventoryId }
            });
            setItems(response.data.data || []);
            setTotal(response.data.totalRecords || 0);
        } catch (error) {
            const msg = error.response?.data?.message || "Action failed";
            setMessage({ text: msg, type: "danger" });
            if (error.response?.status === 401) navigate("/login");
            setItems([]);
        }
    }, [filter, inventoryId]);

    useEffect(() => {
        const delay = setTimeout(() => fetchItems(), 500);
        return () => clearTimeout(delay);
    }, [fetchItems]);

    return(
      <>
        <div className="container-fluid w-75 mt-4 shadow-lg rounded-4 p-4 mb-2">
            {message.text && (
                <div className={`alert alert-${message.type}`}>{message.text}</div>
            )}
            <div className="d-flex justify-content-center align-items-center">
                <h1>Items</h1>
            </div>
            
            <table className="table table-striped table-hover">
                <thead>
                    <tr>
                        <th>Custom Id</th>
                        <th>Name</th>
                        <th>Description</th>
                        <th>Created At</th>
                        <th>Updated At</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item) => (
                        <tr key={item.id}>
                            <td>{item.customId}</td>
                            <td>{item.name}</td>
                            <td>{item.description}</td>
                            <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                            <td>{new Date(item.updatedAt).toLocaleDateString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
                    <nav aria-label="...">
                      <ul className="pagination  d-flex justify-content-center">
                        <li className={`page-item ${filter.pageNumber<=1? 'disabled':''}`}>
                            <button 
                              className="page-link" 
                              onClick={() => setFilter(prev => ({ ...prev, pageNumber: prev.pageNumber - 1 }))}
                              disabled={filter.pageNumber <= 1}
                            >
                              Previous
                            </button>
                        </li>
                        {[...Array(totalPages)].map((_, index) => {
                          const pageNum = index + 1;
                          return (
                            <li key={pageNum} className={`page-item ${filter.pageNumber === pageNum ? 'active' : ''}`}>
                              <button 
                                className="page-link" 
                                onClick={() => setFilter(prev => ({ ...prev, pageNumber: pageNum }))}
                              >
                                {pageNum}
                              </button>
                            </li>
                          );
                        })}
                        
                        <li className={`page-item ${filter.pageNumber>=totalPages?'disabled':''}`}>
                            <button className="page-link"
                                onClick={()=>setFilter(prev=>({...prev, pageNumber: prev.pageNumber+1}))}
                                disabled={filter.pageNumber >= totalPages}
                            >
                                Next
                            </button>
                        </li>
                      </ul>
                    </nav>
        </>
);
}
export default InventoryPage;