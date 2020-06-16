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
import com.google.appengine.api.datastore.Query.SortDirection;

@WebServlet(name = "SearchTimelineQuery", urlPatterns = { "/searchTimeline" })
public class SearchTimelineQuery extends HttpServlet {

    /**
	 *
	 */
	private static final long serialVersionUID = 1L;

	@Override
    public void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
        String search = request.getParameter("email");
		response.setContentType("application/json");
        PrintWriter out = response.getWriter();

		DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();
        Query friendsQuery = new Query("Friendship").setFilter(
            new FilterPredicate("askingUser", FilterOperator.EQUAL, search)
        );
        friendsQuery.addProjection(new PropertyProjection("targetUser", String.class));
        friendsQuery.setDistinct(true);
        PreparedQuery preparedFriendsQuery = datastore.prepare(friendsQuery);
        List<Entity> friendsQueryResult = preparedFriendsQuery.asList(FetchOptions.Builder.withDefaults());

		String postsJson="{}";
        int users_count=1;
		if(!friendsQueryResult.isEmpty()) {
			for (Entity friendship : friendsQueryResult) {
                Query userQuery = new Query("tinyUser").setFilter(new FilterPredicate("email", FilterOperator.EQUAL, friendship.getProperty("targetUser")));
                PreparedQuery preparedUserQuery = datastore.prepare(userQuery);
                Entity tinyUser = preparedUserQuery.asSingleEntity();

                Query postQuery = new Query("Post").setFilter(new FilterPredicate("owner", FilterOperator.EQUAL, friendship.getProperty("targetUser")));
                postQuery.addSort("date", SortDirection.DESCENDING);
                PreparedQuery preparedPostQuery = datastore.prepare(postQuery);
                List<Entity> postsQueryResult = preparedPostQuery.asList(FetchOptions.Builder.withLimit(5));
                int posts_count=1;
                if(!postsQueryResult.isEmpty()) {
                    postsJson = "{\"posts\": [";
                    for(Entity post : postsQueryResult) {
                        postsJson += "{";
                        postsJson += "\"tinyUser\":";
                        postsJson += "{";
                        postsJson += "\"email\":\""+tinyUser.getProperty("email")+"\",";
                        postsJson += "\"name\":\""+tinyUser.getProperty("name")+"\",";
                        postsJson += "\"url\":\""+tinyUser.getProperty("url")+"\"";
                        postsJson += "},";
                        postsJson += "\"url\":\""+post.getProperty("url")+"\",";
                        postsJson += "\"body\":\""+post.getProperty("body")+"\",";
                        postsJson += "\"date\":\""+post.getProperty("date")+"\",";
                        postsJson += "\"key\":\""+post.getProperty("key")+"\",";
                        postsJson += "\"likes\":"+post.getProperty("likes");
                        postsJson += "}";
                        if(posts_count != postsQueryResult.size()) postsJson += ",";
                        posts_count++;
                    }
                    postsJson += "]";
                    postsJson += "}";
                }
            }
        }
		out.print(postsJson);
        out.flush();
    }
}