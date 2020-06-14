package foo;
import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;
import java.util.Arrays;

import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.google.appengine.api.datastore.DatastoreService;
import com.google.appengine.api.datastore.DatastoreServiceFactory;
import com.google.appengine.api.datastore.Entity;
import com.google.appengine.api.datastore.EntityNotFoundException;
import com.google.appengine.api.datastore.FetchOptions;
import com.google.appengine.api.datastore.PreparedQuery;
import com.google.appengine.api.datastore.PropertyProjection;
import com.google.appengine.api.datastore.Query;
import com.google.appengine.api.datastore.Query.CompositeFilterOperator;
import com.google.appengine.api.datastore.Query.CompositeFilter;
import com.google.appengine.api.datastore.Query.FilterOperator;
import com.google.appengine.api.datastore.Query.FilterPredicate;

@WebServlet(name = "SearchUserQuery", urlPatterns = { "/search" })
public class SearchUserQuery extends HttpServlet {

    /**
	 *
	 */
	private static final long serialVersionUID = 1L;

	@Override
    public void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        String search = request.getParameter("search");
        String me = request.getParameter("me");
		response.setContentType("application/json");
        PrintWriter out = response.getWriter();

		DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();
        Query searchQuery = new Query("tinyUser").setFilter(
			new CompositeFilter(CompositeFilterOperator.OR, Arrays.asList(
				new FilterPredicate("email", FilterOperator.EQUAL, search),
				new FilterPredicate("firstName", FilterOperator.EQUAL, search),
				new FilterPredicate("lastName", FilterOperator.EQUAL, search),
				new FilterPredicate("name", FilterOperator.EQUAL, search),
				new FilterPredicate("inversedName", FilterOperator.EQUAL, search)
			))
		);
        PreparedQuery preparedSearchQuery = datastore.prepare(searchQuery);
		List<Entity> searchQueryResult = preparedSearchQuery.asList(FetchOptions.Builder.withDefaults());

		String usersJson="{}";
		int users_count=1;
		if(!searchQueryResult.isEmpty()) {
			usersJson = "{\"tinyUser\": [";
			for (Entity tinyUser : searchQueryResult) {
				usersJson += "{";
				usersJson += "\"email\":\""+tinyUser.getProperty("email")+"\",";
				usersJson += "\"name\":\""+tinyUser.getProperty("name")+"\",";
				usersJson += "\"invertedName\":\""+tinyUser.getProperty("invertedName")+"\",";
				usersJson += "\"firstName\":\""+tinyUser.getProperty("firstName")+"\",";
				usersJson += "\"lastName\":\""+tinyUser.getProperty("lastName")+"\",";

				DatastoreService datastore_2 = DatastoreServiceFactory.getDatastoreService();
		        Query friendQuery = new Query("Friendship").setFilter(CompositeFilterOperator.and(
		        		new FilterPredicate("askingUser", FilterOperator.EQUAL, me),
		        		new FilterPredicate("targetUser", FilterOperator.EQUAL, search)
		        		));
		        PreparedQuery preparedFriendQuery = datastore_2.prepare(friendQuery);
				List<Entity> friendQueryResult = preparedFriendQuery.asList(FetchOptions.Builder.withDefaults());

				if (friendQueryResult.isEmpty()) {
					usersJson += "\"friend\":false}";

				} else {
					usersJson += "\"friend\":true}";
				}
				if(users_count != searchQueryResult.size()) usersJson += ",";
				users_count++;
			}
			usersJson += "]}";
		}
		out.print(usersJson);
		out.flush();
    }
}