import React, { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

const IDs = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [emailIds, setEmailIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [limitInputs, setLimitInputs] = useState({});

  // Fetch email IDs from user.json and counters
  useEffect(() => {
    const fetchEmailIds = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch users and counters in parallel
        const [usersResponse, countersResponse] = await Promise.all([
          fetch('/api/users'),
          fetch('/api/emailCounters')
        ]);
        
        if (usersResponse.ok && countersResponse.ok) {
          const usersData = await usersResponse.json();
          const countersData = await countersResponse.json();
          
          // Transform user data to email ID format with real counter data
          const transformedIds = usersData.users.map(user => {
            const counter = countersData.emailCounters.find(c => c.emailId === user.id);
            return {
              id: user.id,
              label: user.name,
              email: user.email,
              provider: "Gmail", // Default provider since it's not in user.json
              dailyLimit: counter ? counter.dailyLimit : 100,
              emailsSentToday: counter ? counter.emailsSentToday : 0,
              isBlocked: counter ? counter.isBlocked : false,
              blockedUntil: counter ? counter.blockedUntil : null,
              lastResetAt: counter ? counter.lastResetAt : new Date().toISOString()
            };
          });
          setEmailIds(transformedIds);
        } else {
          setError('Failed to load email IDs or counters');
        }
      } catch (error) {
        console.error('Error fetching email IDs:', error);
        setError('Error loading email IDs');
      } finally {
        setLoading(false);
      }
    };

    fetchEmailIds();
  }, []);

  // Filter and sort email IDs
  const filteredAndSortedIds = emailIds
    .filter(emailId => 
      emailId.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emailId.email.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      let aValue = a[sortBy] || "";
      let bValue = b[sortBy] || "";
      
      if (sortOrder === "asc") {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const handleSaveLimit = async (emailId, newLimit) => {
    try {
      const response = await fetch('/api/emailCounters', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emailId: emailId,
          dailyLimit: newLimit
        }),
      });

      if (response.ok) {
        // Update local state
        setEmailIds(prev => prev.map(id => 
          id.id === emailId 
            ? { ...id, dailyLimit: newLimit }
            : id
        ));
      } else {
        console.error('Failed to update daily limit');
      }
    } catch (error) {
      console.error('Error updating daily limit:', error);
    }
  };

  const handleResetCounter = async (emailId) => {
    try {
      const response = await fetch(`/api/emailCounters?emailId=${emailId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Refresh the data
        const fetchEmailIds = async () => {
          const [usersResponse, countersResponse] = await Promise.all([
            fetch('/api/users'),
            fetch('/api/emailCounters')
          ]);
          
          if (usersResponse.ok && countersResponse.ok) {
            const usersData = await usersResponse.json();
            const countersData = await countersResponse.json();
            
            const transformedIds = usersData.users.map(user => {
              const counter = countersData.emailCounters.find(c => c.emailId === user.id);
              return {
                id: user.id,
                label: user.name,
                email: user.email,
                provider: "Gmail",
                dailyLimit: counter ? counter.dailyLimit : 100,
                emailsSentToday: counter ? counter.emailsSentToday : 0,
                isBlocked: counter ? counter.isBlocked : false,
                blockedUntil: counter ? counter.blockedUntil : null,
                lastResetAt: counter ? counter.lastResetAt : new Date().toISOString()
              };
            });
            setEmailIds(transformedIds);
          }
        };
        fetchEmailIds();
      } else {
        console.error('Failed to reset counter');
      }
    } catch (error) {
      console.error('Error resetting counter:', error);
    }
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {loading && (
        <div className="glass rounded-lg shadow p-6 border">
          <div className="flex items-center justify-center">
            <div className="w-6 h-6 border-2 rounded-full animate-spin mr-3" style={{borderColor:'currentColor', borderTopColor:'transparent'}}></div>
            <span>Loading email IDs...</span>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-lg border glass">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium">Error loading email IDs</h3>
              <div className="mt-2 text-sm">{error}</div>
            </div>
          </div>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold text-gray-800">Total Email IDs</h3>
              <p className="text-3xl font-bold">{emailIds.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold text-gray-800">Active IDs</h3>
              <p className="text-3xl font-bold">
                {emailIds.filter(id => !id.isBlocked).length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-semibold text-gray-800">Blocked IDs</h3>
              <p className="text-3xl font-bold">
                {emailIds.filter(id => id.isBlocked).length}
              </p>
            </div>
          </div>

          <div className="glass rounded-lg shadow">
            <div className="p-4 border-b">
              <h3 className="text-lg font-semibold">Email IDs Overview</h3>
            </div>
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <Input
                  placeholder="Search email IDs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-sm"
                />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th 
                        className="text-left p-2 cursor-pointer hover:bg-foreground/6"
                        onClick={() => handleSort("label")}
                      >
                        Label {sortBy === "label" && (sortOrder === "asc" ? "↑" : "↓")}
                      </th>
                      <th 
                        className="text-left p-2 cursor-pointer hover:bg-foreground/6"
                        onClick={() => handleSort("email")}
                      >
                        Email {sortBy === "email" && (sortOrder === "asc" ? "↑" : "↓")}
                      </th>
                      <th 
                        className="text-left p-2 cursor-pointer hover:bg-foreground/6"
                        onClick={() => handleSort("provider")}
                      >
                        Provider {sortBy === "provider" && (sortOrder === "asc" ? "↑" : "↓")}
                      </th>
                      <th className="text-left p-2">Daily Limit</th>
                      <th className="text-left p-2">Sent Today</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAndSortedIds.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center py-8 text-foreground/60">
                          {searchQuery ? 'No email IDs found matching your search.' : 'No email IDs available.'}
                        </td>
                      </tr>
                    ) : (
                      filteredAndSortedIds.map((emailId) => (
                        <tr key={emailId.id} className="border-b hover:bg-foreground/6">
                          <td className="p-2">{emailId.label}</td>
                          <td className="p-2">{emailId.email}</td>
                          <td className="p-2">{emailId.provider}</td>
                          <td className="p-2">{emailId.dailyLimit}</td>
                          <td className="p-2">{emailId.emailsSentToday}</td>
                          <td className="p-2">
                            <span className={`px-2 py-1 rounded text-xs bg-foreground/10`}>
                              {emailId.isBlocked ? 'Blocked' : 'Active'}
                            </span>
                          </td>
                          <td className="p-2">
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderLimits = () => {
    const handleLimitChange = (emailId, value) => {
      setLimitInputs(prev => ({
        ...prev,
        [emailId]: value
      }));
    };

    const handleSaveLimitLocal = async (emailId) => {
      const newLimit = limitInputs[emailId] || emailIds.find(id => id.id === emailId)?.dailyLimit;
      if (newLimit !== undefined) {
        await handleSaveLimit(emailId, newLimit);
        // Clear the input after saving
        setLimitInputs(prev => {
          const newInputs = { ...prev };
          delete newInputs[emailId];
          return newInputs;
        });
      }
    };

    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Daily Limits Configuration</h3>
        <p className="text-gray-600 mb-4">
          Configure daily sending limits for each email ID. Limits are enforced to prevent rate limiting and maintain good sending reputation.
        </p>
        
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 rounded-full animate-spin mr-3" style={{borderColor:'currentColor', borderTopColor:'transparent'}}></div>
            <span>Loading email IDs...</span>
          </div>
        )}

        {error && (
          <div className="rounded-lg p-4 glass border">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium">Error loading email IDs</h3>
                <div className="mt-2 text-sm">{error}</div>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-4">
            {emailIds.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No email IDs available to configure.
              </div>
            ) : (
              emailIds.map((emailId) => (
                <div key={emailId.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <h4 className="font-medium">{emailId.label}</h4>
                      <p className="text-sm text-gray-600">{emailId.email}</p>
                      <div className="mt-2 text-sm text-gray-500">
                        <span>Sent today: {emailId.emailsSentToday}/{emailId.dailyLimit}</span>
                        {emailId.isBlocked && (
                          <span className="ml-4">
                            Blocked until: {new Date(emailId.blockedUntil).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div>
                        <label className="text-sm font-medium">Daily Limit</label>
                        <Input
                          type="number"
                          value={limitInputs[emailId.id] !== undefined ? limitInputs[emailId.id] : emailId.dailyLimit}
                          onChange={(e) => handleLimitChange(emailId.id, e.target.value)}
                          className="w-20"
                        />
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleSaveLimitLocal(emailId.id)}
                      >
                        Save
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleResetCounter(emailId.id)}
                        className="hover:opacity-80"
                      >
                        Reset Counter
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    );
  };

  const renderHistory = () => (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Sending History</h3>
      <p className="text-gray-600 mb-4">
        View historical data about email sending patterns and limit enforcement.
      </p>
      <div className="space-y-4">
        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-2">Last 7 Days Activity</h4>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 7 }, (_, i) => (
              <div key={i} className="text-center">
                <div className="text-xs text-gray-600">Day {i + 1}</div>
                <div className="text-sm font-medium">--</div>
              </div>
            ))}
          </div>
        </div>
        <div className="border rounded-lg p-4">
          <h4 className="font-medium mb-2">Recent Limit Events</h4>
          <p className="text-gray-600 text-sm">No recent limit events to display.</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Email IDs Management</h1>
        <p className="text-foreground/70 mt-2">
          Manage your sending identities, configure daily limits, and monitor usage.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "dashboard"
                ? "border-foreground"
                : "border-transparent hover:opacity-80"
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab("limits")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "limits"
                ? "border-foreground"
                : "border-transparent hover:opacity-80"
            }`}
          >
            Limits
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === "history"
                ? "border-foreground"
                : "border-transparent hover:opacity-80"
            }`}
          >
            History
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "dashboard" && renderDashboard()}
      {activeTab === "limits" && renderLimits()}
      {activeTab === "history" && renderHistory()}
    </div>
  );
};

export default IDs;
