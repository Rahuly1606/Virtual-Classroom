import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Spinner from '../../components/ui/Spinner'
import { BiSearch, BiPlus, BiCalendarPlus, BiEdit, BiTrash, BiVideoPlus } from 'react-icons/bi'
import useAuth from '../../hooks/useAuth'
import sessionService from '../../services/sessionService'
import { toast } from 'react-toastify'
import { format } from 'date-fns'

const Sessions = () => {
  const { user } = useAuth()
  const isTeacher = user?.role === 'teacher'
  
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all') // all, upcoming, active, past
  
  // Fetch sessions on mount and when filters change
  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true)
        const data = await sessionService.getSessions()
        setSessions(data)
      } catch (error) {
        console.error('Error fetching sessions:', error)
        toast.error('Failed to load sessions')
      } finally {
        setLoading(false)
      }
    }
    
    fetchSessions()
  }, [])
  
  // Filter and search sessions
  const filteredSessions = sessions
    .filter(session => {
      const now = new Date()
      const startTime = new Date(session.startTime)
      const endTime = new Date(session.endTime)
      
      switch (filter) {
        case 'upcoming':
          return startTime > now
        case 'active':
          return startTime <= now && endTime >= now
        case 'past':
          return endTime < now
        default:
          return true
      }
    })
    .filter(session => {
      const searchLower = searchTerm.toLowerCase()
      return (
        session.title.toLowerCase().includes(searchLower) ||
        (session.description && session.description.toLowerCase().includes(searchLower)) ||
        (session.course && session.course.name.toLowerCase().includes(searchLower))
      )
    })
  
  // Handle delete session
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this session?')) {
      return
    }
    
    try {
      await sessionService.deleteSession(id)
      setSessions(sessions.filter(session => session._id !== id))
      toast.success('Session deleted successfully')
    } catch (error) {
      console.error('Error deleting session:', error)
      toast.error('Failed to delete session')
    }
  }
  
  // Calculate session status
  const getSessionStatus = (session) => {
    const now = new Date()
    const startTime = new Date(session.startTime)
    const endTime = new Date(session.endTime)
    
    if (now < startTime) {
      return 'upcoming'
    } else if (now >= startTime && now <= endTime) {
      return 'active'
    } else {
      return 'ended'
    }
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sessions</h1>
        {isTeacher && (
          <Button to="/sessions/create" icon={<BiCalendarPlus className="h-5 w-5" />} variant="primary">
            Create Session
          </Button>
        )}
      </div>
      
      {/* Filters and search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full max-w-md items-center rounded-md border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-700">
          <BiSearch className="h-5 w-5 text-gray-400" />
          <Input
            placeholder="Search sessions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="ml-2 flex-1 border-0 focus:outline-none focus:ring-0"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filter === 'all' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            variant={filter === 'upcoming' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilter('upcoming')}
          >
            Upcoming
          </Button>
          <Button
            variant={filter === 'active' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilter('active')}
          >
            Active
          </Button>
          <Button
            variant={filter === 'past' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilter('past')}
          >
            Past
          </Button>
        </div>
      </div>
      
      {/* Sessions list */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : filteredSessions.length === 0 ? (
        <Card>
          <Card.Body>
            <div className="flex flex-col items-center justify-center py-8">
              <BiVideoPlus className="h-16 w-16 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No sessions found</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {filter !== 'all'
                  ? `No ${filter} sessions found. Try changing the filter.`
                  : searchTerm
                  ? 'No sessions match your search. Try a different search term.'
                  : isTeacher
                  ? 'Create your first session to get started.'
                  : 'No sessions available yet. Check back later.'}
              </p>
              {isTeacher && filter === 'all' && !searchTerm && (
                <Button to="/sessions/create" variant="primary" className="mt-4">
                  Create Your First Session
                </Button>
              )}
            </div>
          </Card.Body>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
          {filteredSessions.map((session) => {
            const status = getSessionStatus(session)
            
            return (
              <Card key={session._id} className="overflow-hidden transition-shadow duration-200 hover:shadow-lg bg-white dark:bg-gray-800">
                <Link to={`/sessions/${session._id}`} className="block">
                  <div className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">{session.title}</h3>
                        <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                          {session.course?.title || 'No course assigned'}
                        </div>
                        <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                          {new Date(session.startTime).toLocaleDateString()} | {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(session.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <div className="flex items-center">
                        {status === 'upcoming' && (
                          <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            Upcoming
                          </span>
                        )}
                        {status === 'active' && (
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                            Live Now
                          </span>
                        )}
                        {status === 'ended' && (
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                            Completed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default Sessions 